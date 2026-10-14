import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.approval import Approval
from app.models.message import Message
from app.models.user import User
from app.schemas.listing import (
    AuditLogOut,
    ListingCreate,
    ListingDocumentOut,
    ListingOut,
    ListingUpdate,
    ValidationResultOut,
)
from app.services import listing_service
from app.services.audit import log_action

router = APIRouter(prefix="/listings", tags=["listings"])


# ── List / create ──────────────────────────────────────────────────────────────

@router.get("", response_model=dict)
async def list_listings(
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await listing_service.list_listings(
        db, status=status, priority=priority, search=search, page=page, page_size=page_size
    )
    return {
        "items": [ListingOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: ListingCreate,
    request: Request,
    current_user: User = Depends(require_permission("manage_listing_fields")),
    db: AsyncSession = Depends(get_db),
):
    listing = await listing_service.create_listing(
        db, body.model_dump(), current_user.id
    )
    await log_action(
        db,
        user_id=current_user.id,
        listing_id=listing.id,
        action="listing.created",
        entity_type="listing",
        entity_id=str(listing.id),
        ip_address=request.client.host if request.client else "",
    )
    return ListingOut.model_validate(listing)


# ── Single listing ─────────────────────────────────────────────────────────────

@router.get("/{listing_id}", response_model=ListingOut)
async def get_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = await listing_service.get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return listing


@router.patch("/{listing_id}", response_model=ListingOut)
async def update_listing(
    listing_id: uuid.UUID,
    body: ListingUpdate,
    request: Request,
    current_user: User = Depends(require_permission("manage_listing_fields")),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.update_listing(
        db, listing_id, body.model_dump(exclude_none=True), current_user.id
    )


@router.post("/{listing_id}/approve", response_model=ListingOut)
async def approve_listing(
    listing_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_permission("approve_listing")),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.approve_listing(
        db,
        listing_id,
        current_user.id,
        ip=request.client.host if request.client else "",
    )


# ── Documents ─────────────────────────────────────────────────────────────────

@router.get("/{listing_id}/documents", response_model=list[ListingDocumentOut])
async def get_documents(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.get_listing_documents(db, listing_id)


class DocumentCreate(BaseModel):
    document_type: str
    file_name: str
    mime_type: str


@router.post("/{listing_id}/documents", status_code=status.HTTP_201_CREATED, response_model=ListingDocumentOut)
async def upload_document(
    listing_id: uuid.UUID,
    body: DocumentCreate,
    request: Request,
    current_user: User = Depends(require_permission("manage_documents")),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    data["storage_path"] = f"documents/{listing_id}/{uuid.uuid4()}/{body.file_name}"
    doc = await listing_service.create_listing_document(
        db, listing_id, data, current_user.id
    )
    await log_action(
        db,
        user_id=current_user.id,
        listing_id=listing_id,
        action="document.uploaded",
        entity_type="listing_document",
        entity_id=str(doc.id),
        ip_address=request.client.host if request.client else "",
    )
    return doc


# ── Validations ───────────────────────────────────────────────────────────────

@router.get("/{listing_id}/validations", response_model=list[ValidationResultOut])
async def get_validations(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.get_listing_validations(db, listing_id)


class ResolveValidationBody(BaseModel):
    resolution_note: str


@router.patch("/{listing_id}/validations/{validation_id}", response_model=ValidationResultOut)
async def resolve_validation(
    listing_id: uuid.UUID,
    validation_id: uuid.UUID,
    body: ResolveValidationBody,
    current_user: User = Depends(require_permission("resolve_validation_conflicts")),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.resolve_validation(
        db, validation_id, current_user.id, body.resolution_note
    )


# ── Activity ──────────────────────────────────────────────────────────────────

@router.get("/{listing_id}/activity", response_model=dict)
async def get_activity(
    listing_id: uuid.UUID,
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await listing_service.get_listing_activity(
        db, listing_id, page=page, page_size=page_size
    )
    return {
        "items": [AuditLogOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ── Missing info request ──────────────────────────────────────────────────────

class MissingInfoRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    field_ids: list[str] = []


@router.post("/{listing_id}/missing-info-requests")
async def request_missing_info(
    listing_id: uuid.UUID,
    body: MissingInfoRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = await listing_service.get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # Create message record (draft — NOT sent until human approves)
    message = Message(
        listing_id=listing_id,
        owner_user_id=current_user.id,
        to_emails=[body.to_email],
        subject=body.subject,
        body=body.body,
        message_type="agent_request",
        is_read=False,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    # Create approval gate — human must approve before email is sent
    approval = Approval(
        listing_id=listing_id,
        action_type="email_send",
        requested_by=current_user.id,
        status="pending",
        payload_snapshot={
            "message_id": str(message.id),
            "to_email": body.to_email,
            "subject": body.subject,
            "field_ids": body.field_ids,
        },
    )
    db.add(approval)
    await db.flush()
    await db.refresh(approval)

    await log_action(
        db,
        user_id=current_user.id,
        listing_id=listing_id,
        action="missing_info.requested",
        entity_type="message",
        entity_id=str(message.id),
        new_value={"to_email": body.to_email, "field_ids": body.field_ids},
    )

    return {
        "approval_id": str(approval.id),
        "message_id": str(message.id),
        "status": "pending_approval",
    }


# ── TREB copy (prepare-only, NO API) ─────────────────────────────────────────

@router.get("/{listing_id}/treb-copy")
async def get_treb_copy(
    listing_id: uuid.UUID,
    current_user: User = Depends(require_permission("prepare_treb_data")),
    db: AsyncSession = Depends(get_db),
):
    # NO external API call, NO TREB portal access, NO stored credentials — prepare-only copy data
    data = await listing_service.get_treb_copy(db, listing_id)
    response = JSONResponse(content=data)
    response.headers["X-TREB-No-API"] = "true"
    return response
