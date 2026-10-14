import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.message import Message
from app.models.user import User
from app.schemas.listing import MessageOut

router = APIRouter(prefix="/inbox", tags=["inbox"])

_TAB_FILTERS = {
    "agent_requests": "agent_request",
    "system_notifications": "system_notification",
    "comments": "comment",
}


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count()).where(
            Message.owner_user_id == current_user.id,
            Message.is_read == False,  # noqa: E712
        )
    )
    return {"count": result.scalar_one()}


@router.get("", response_model=dict)
async def list_inbox(
    tab: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Message).where(Message.owner_user_id == current_user.id)

    if tab and tab in _TAB_FILTERS:
        q = q.where(Message.message_type == _TAB_FILTERS[tab])

    if search:
        term = f"%{search}%"
        q = q.where(
            or_(Message.subject.ilike(term), Message.from_email.ilike(term), Message.body.ilike(term))
        )

    unread_q = select(func.count()).where(
        Message.owner_user_id == current_user.id, Message.is_read == False  # noqa: E712
    )
    unread_count_val = (await db.execute(unread_q)).scalar_one()

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(Message.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    items = result.scalars().all()

    return {
        "items": [MessageOut.model_validate(i) for i in items],
        "total": total,
        "unread_count": unread_count_val,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{message_id}/read")
async def mark_read(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message).where(
            Message.id == message_id, Message.owner_user_id == current_user.id
        )
    )
    message = result.scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    message.is_read = True
    await db.flush()
    return {"status": "ok"}
