import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class ApprovalCreate(BaseModel):
    listing_id: uuid.UUID
    action_type: str
    payload_snapshot: dict[str, Any] = {}


class ApprovalDecision(BaseModel):
    status: Literal["approved", "rejected"]
    notes: str = ""


class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    action_type: str
    requested_by: uuid.UUID
    approved_by: uuid.UUID | None
    status: str
    payload_snapshot: Any | None
    notes: str | None
    created_at: datetime
    decided_at: datetime | None
