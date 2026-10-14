import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class ListingCreate(BaseModel):
    address: str
    city: str
    postal_code: str
    listing_type: str
    list_price: Decimal
    live_date: date
    agent_name: str
    agent_email: str


class ListingUpdate(BaseModel):
    address: str | None = None
    city: str | None = None
    postal_code: str | None = None
    listing_type: str | None = None
    list_price: Decimal | None = None
    live_date: date | None = None
    agent_name: str | None = None
    agent_email: str | None = None
    mls_number: str | None = None
    priority: str | None = None
    treb_pass: str | None = None


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    internal_ref: str | None
    source_email_id: str | None
    address: str | None
    city: str | None
    postal_code: str | None
    listing_type: str | None
    status: str
    priority: str
    list_price: Decimal | None
    live_date: date | None
    agent_name: str | None
    agent_email: str | None
    mls_number: str | None
    treb_pass: str
    locked_at: datetime | None
    assigned_to: uuid.UUID | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class ExtractedFieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    field_id: str
    value: str | None
    override_value: str | None
    confidence: Decimal | None
    status: str
    source_doc: str | None
    source_page: int | None
    source_bbox: Any | None
    reviewer_id: uuid.UUID | None
    reviewed_at: datetime | None
    override_note: str | None
    created_at: datetime
    updated_at: datetime


class ListingDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    document_type: str | None
    file_name: str | None
    storage_path: str | None
    content_hash: str | None
    file_size: int | None
    mime_type: str | None
    status: str
    uploaded_by: uuid.UUID | None
    extracted_at: datetime | None
    created_at: datetime


class ValidationResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    rule_id: str | None
    field_id: str | None
    severity: str | None
    outcome: str | None
    message: str | None
    resolved_by: uuid.UUID | None
    resolved_at: datetime | None
    resolution_note: str | None
    created_at: datetime
    updated_at: datetime | None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID | None
    listing_id: uuid.UUID | None
    action: str | None
    entity_type: str | None
    entity_id: str | None
    old_value: dict | None
    new_value: dict | None
    ip_address: str | None
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID | None
    owner_user_id: uuid.UUID
    gmail_thread_id: str | None
    gmail_message_id: str | None
    from_email: str | None
    to_emails: list | None
    subject: str | None
    body: str | None
    message_type: str | None
    is_read: bool
    sent_at: datetime | None
    received_at: datetime | None
    created_at: datetime
