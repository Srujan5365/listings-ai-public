import sys
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def log_action(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    listing_id: uuid.UUID | None,
    action: str,
    entity_type: str = "",
    entity_id: str = "",
    old_value: Any = None,
    new_value: Any = None,
    ip_address: str = "",
    user_agent: str = "",
) -> None:
    try:
        entry = AuditLog(
            user_id=user_id,
            listing_id=listing_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(entry)
        await db.flush()
    except Exception as exc:
        print(f"[audit] failed to log action '{action}': {exc}", file=sys.stderr)
