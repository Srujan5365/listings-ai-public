import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.listing import Listing
from app.services.audit import log_action

VALID_TRANSITIONS: dict[str, list[str]] = {
    "received": ["splitting", "exception", "cancelled"],
    "splitting": ["reading", "exception", "cancelled"],
    "reading": ["looking_up", "exception", "cancelled"],
    "looking_up": ["checking", "exception", "cancelled"],
    "checking": ["awaiting_agent", "ready_for_review", "exception", "cancelled"],
    "awaiting_agent": ["reading", "checking", "exception", "cancelled"],
    "ready_for_review": ["in_review", "exception", "cancelled"],
    "in_review": ["approved", "ready_for_review", "exception", "cancelled"],
    "approved": ["writing", "exception"],
    "writing": ["written", "exception"],
    "written": ["treb_preloaded", "exception"],
    "treb_preloaded": ["treb_live", "exception"],
    "treb_live": ["closed"],
    "closed": [],
    "exception": ["received", "splitting", "reading", "checking", "cancelled"],
    "cancelled": [],
}


async def transition_status(
    db: AsyncSession,
    listing_id: uuid.UUID,
    new_status: str,
    user_id: uuid.UUID | None,
    ip: str = "",
) -> Listing:
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    allowed = VALID_TRANSITIONS.get(listing.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot transition from '{listing.status}' to '{new_status}'. "
                f"Allowed: {allowed}"
            ),
        )

    old_status = listing.status
    listing.status = new_status
    await db.flush()

    await log_action(
        db=db,
        user_id=user_id,
        listing_id=listing_id,
        action="listing.status.changed",
        entity_type="listing",
        entity_id=str(listing_id),
        old_value={"status": old_status},
        new_value={"status": new_status},
        ip_address=ip,
    )

    await db.refresh(listing)
    return listing
