import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval


async def require_approval(
    db: AsyncSession,
    listing_id: uuid.UUID,
    action_type: str,
    user_id: uuid.UUID,
) -> Approval:
    result = await db.execute(
        select(Approval).where(
            Approval.listing_id == listing_id,
            Approval.action_type == action_type,
            Approval.status == "approved",
        )
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Human approval required before this action",
        )
    return approval


async def record_approval(
    db: AsyncSession,
    listing_id: uuid.UUID,
    action_type: str,
    requested_by: uuid.UUID,
    payload: dict,
) -> Approval:
    approval = Approval(
        listing_id=listing_id,
        action_type=action_type,
        requested_by=requested_by,
        status="pending",
        payload_snapshot=payload,
    )
    db.add(approval)
    await db.flush()
    await db.refresh(approval)
    return approval


async def decide_approval(
    db: AsyncSession,
    approval_id: uuid.UUID,
    approver_id: uuid.UUID,
    decision_status: str,
    notes: str = "",
) -> Approval:
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if approval is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval record not found",
        )
    approval.status = decision_status
    approval.approved_by = approver_id
    approval.decided_at = datetime.now(timezone.utc)
    approval.notes = notes
    await db.flush()
    await db.refresh(approval)
    return approval
