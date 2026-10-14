import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission
from app.models.audit import AuditLog
from app.schemas.listing import AuditLogOut

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", response_model=dict)
async def list_activity(
    listing_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user=Depends(require_permission("view_audit_logs")),
    db: AsyncSession = Depends(get_db),
):
    q = select(AuditLog)
    if listing_id:
        q = q.where(AuditLog.listing_id == listing_id)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)
    if action:
        q = q.where(AuditLog.action == action)
    if entity_type:
        q = q.where(AuditLog.entity_type == entity_type)
    if from_date:
        q = q.where(AuditLog.created_at >= from_date)
    if to_date:
        q = q.where(AuditLog.created_at <= to_date)

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    items = result.scalars().all()

    return {
        "items": [AuditLogOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
