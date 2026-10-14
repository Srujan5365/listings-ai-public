from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.audit import AuditLog
from app.models.listing import Listing
from app.schemas.listing import AuditLogOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_INACTIVE_STATUSES = ("closed", "cancelled")


@router.get("/metrics")
async def metrics(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    async def _count(condition) -> int:
        result = await db.execute(select(func.count()).where(condition))
        return result.scalar_one()

    active = await _count(Listing.status.not_in(_INACTIVE_STATUSES))
    ready = await _count(Listing.status == "ready_for_review")
    awaiting = await _count(Listing.status == "awaiting_agent")
    exceptions = await _count(Listing.status == "exception")

    return {
        "active_listings": active,
        "ready_for_review": ready,
        "awaiting_agent": awaiting,
        "exceptions": exceptions,
    }


@router.get("/live-dates")
async def live_dates(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Listing)
        .where(
            Listing.live_date.is_not(None),
            Listing.status.not_in(_INACTIVE_STATUSES),
        )
        .order_by(Listing.live_date.asc())
        .limit(10)
    )
    result = await db.execute(q)
    listings = result.scalars().all()

    today = date.today()
    upcoming = []
    for l in listings:
        days_until = (l.live_date - today).days if l.live_date else None
        upcoming.append(
            {
                "listing_id": str(l.id),
                "internal_ref": l.internal_ref,
                "address": l.address,
                "live_date": l.live_date.isoformat() if l.live_date else None,
                "days_until": days_until,
                "status": l.status,
            }
        )

    return {"upcoming": upcoming}


@router.get("/recent-activity")
async def recent_activity(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    )
    items = result.scalars().all()
    return {"items": [AuditLogOut.model_validate(i) for i in items]}
