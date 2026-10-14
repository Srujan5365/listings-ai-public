import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.listing import ExtractedField, Listing, ListingDocument
from app.models.validation import ValidationResult
from app.services.audit import log_action
from app.services.workflow import transition_status

_TREB_SECTION_MAP = {
    "core": ["F-001", "F-002", "F-003", "F-060", "F-061", "F-068"],
    "property": ["F-040", "F-042", "F-043", "F-044", "F-045"],
    "financial": ["F-055", "F-056", "F-134"],
    "legal": ["F-051", "F-052", "F-053", "F-054"],
    "marketing": ["F-050", "F-164", "F-165"],
}

_TREB_CONSTANTS = {
    "seller_property_info_statement": "No",
    "distribute_to_internet": "Yes",
    "display_address": "Yes",
    "distribute_to_ddf": "Yes",
    "permission_to_advertise": "Yes",
    "assessment_year": "",
    "assessment_value": "",
}


async def create_listing(
    db: AsyncSession, data: dict, created_by_id: uuid.UUID
) -> Listing:
    listing = Listing(
        created_by=created_by_id,
        status="received",
        **{k: v for k, v in data.items() if v is not None},
    )
    db.add(listing)
    await db.flush()
    await db.refresh(listing)
    return listing


async def get_listing(db: AsyncSession, listing_id: uuid.UUID) -> Listing | None:
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    return result.scalar_one_or_none()


async def list_listings(
    db: AsyncSession,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Listing], int]:
    q = select(Listing)
    if status:
        q = q.where(Listing.status == status)
    if priority:
        q = q.where(Listing.priority == priority)
    if search:
        term = f"%{search}%"
        q = q.where(
            or_(
                Listing.address.ilike(term),
                Listing.agent_name.ilike(term),
                Listing.agent_email.ilike(term),
                Listing.internal_ref.ilike(term),
            )
        )
    count_q = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all(), total


async def update_listing(
    db: AsyncSession,
    listing_id: uuid.UUID,
    data: dict,
    updated_by_id: uuid.UUID,
) -> Listing:
    listing = await get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    old_values = {}
    new_values = {}
    for key, val in data.items():
        if val is not None and hasattr(listing, key):
            old_val = getattr(listing, key)
            if old_val != val:
                old_values[key] = str(old_val) if old_val is not None else None
                new_values[key] = str(val)
                setattr(listing, key, val)

    await db.flush()
    await db.refresh(listing)

    if new_values:
        await log_action(
            db,
            user_id=updated_by_id,
            listing_id=listing_id,
            action="listing.updated",
            entity_type="listing",
            entity_id=str(listing_id),
            old_value=old_values,
            new_value=new_values,
        )
    return listing


async def approve_listing(
    db: AsyncSession,
    listing_id: uuid.UUID,
    approver_id: uuid.UUID,
    ip: str = "",
) -> Listing:
    listing = await get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    approval = Approval(
        listing_id=listing_id,
        action_type="listing_approve",
        requested_by=approver_id,
        approved_by=approver_id,
        status="approved",
        decided_at=datetime.now(timezone.utc),
        payload_snapshot={"listing_status": listing.status},
    )
    db.add(approval)
    await db.flush()

    listing.locked_at = datetime.now(timezone.utc)
    listing.locked_by = approver_id
    await db.flush()

    listing = await transition_status(db, listing_id, "approved", approver_id, ip)

    await log_action(
        db,
        user_id=approver_id,
        listing_id=listing_id,
        action="listing.approved",
        entity_type="listing",
        entity_id=str(listing_id),
        ip_address=ip,
    )
    return listing


async def get_listing_activity(
    db: AsyncSession,
    listing_id: uuid.UUID,
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[AuditLog], int]:
    q = select(AuditLog).where(AuditLog.listing_id == listing_id).order_by(
        AuditLog.created_at.desc()
    )
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all(), total


async def get_treb_copy(db: AsyncSession, listing_id: uuid.UUID) -> dict:
    # NO external API call, NO credentials, NO TREB portal access — prepare-only
    listing = await get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    result = await db.execute(
        select(ExtractedField).where(
            ExtractedField.listing_id == listing_id,
            ExtractedField.status.in_(["confirmed", "review"]),
        )
    )
    fields = result.scalars().all()
    fields_by_id = {
        f.field_id: {
            "value": f.override_value or f.value,
            "confidence": float(f.confidence) if f.confidence else None,
            "status": f.status,
        }
        for f in fields
    }

    treb_sections = {}
    for section_name, field_ids in _TREB_SECTION_MAP.items():
        treb_sections[section_name] = {
            fid: fields_by_id.get(fid, {"value": None, "confidence": None, "status": "missing"})
            for fid in field_ids
        }

    return {
        "listing_id": str(listing_id),
        "treb_sections": treb_sections,
        "treb_constants": _TREB_CONSTANTS,
        "fields": fields_by_id,
    }


async def get_listing_documents(
    db: AsyncSession, listing_id: uuid.UUID
) -> list[ListingDocument]:
    result = await db.execute(
        select(ListingDocument).where(ListingDocument.listing_id == listing_id)
    )
    return result.scalars().all()


async def create_listing_document(
    db: AsyncSession,
    listing_id: uuid.UUID,
    data: dict,
    uploaded_by_id: uuid.UUID,
) -> ListingDocument:
    doc = ListingDocument(listing_id=listing_id, uploaded_by=uploaded_by_id, **data)
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def get_listing_validations(
    db: AsyncSession, listing_id: uuid.UUID
) -> list[ValidationResult]:
    result = await db.execute(
        select(ValidationResult).where(ValidationResult.listing_id == listing_id)
    )
    return result.scalars().all()


async def resolve_validation(
    db: AsyncSession,
    validation_id: uuid.UUID,
    resolver_id: uuid.UUID,
    resolution_note: str,
) -> ValidationResult:
    result = await db.execute(
        select(ValidationResult).where(ValidationResult.id == validation_id)
    )
    val = result.scalar_one_or_none()
    if val is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Validation result not found"
        )

    val.resolved_by = resolver_id
    val.resolved_at = datetime.now(timezone.utc)
    val.resolution_note = resolution_note
    val.outcome = "pass"
    await db.flush()
    await db.refresh(val)

    await log_action(
        db,
        user_id=resolver_id,
        listing_id=val.listing_id,
        action="validation.resolved",
        entity_type="validation_result",
        entity_id=str(validation_id),
        new_value={"resolution_note": resolution_note},
    )
    return val
