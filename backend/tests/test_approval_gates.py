import uuid
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.message import Message
from app.services.approval_gate import require_approval
from tests.helpers import make_listing, make_user


async def _make_approval(db, listing_id, action_type, user_id, status="approved"):
    approval = Approval(
        id=uuid.uuid4(),
        listing_id=listing_id,
        action_type=action_type,
        requested_by=user_id,
        approved_by=user_id if status == "approved" else None,
        status=status,
        payload_snapshot={},
        decided_at=datetime.now(timezone.utc) if status != "pending" else None,
    )
    db.add(approval)
    await db.flush()
    return approval


async def test_fub_sync_blocked_without_approval(client, db_session):
    user, headers = await make_user(db_session, "fub@gate.test", "coord", ["manage_listing_fields"])
    listing = await make_listing(db_session, user.id)
    resp = await client.post(
        f"/api/v1/integrations/fub/sync/{listing.id}",
        headers=headers,
    )
    assert resp.status_code == 403


async def test_asana_sync_blocked_without_approval(client, db_session):
    user, headers = await make_user(db_session, "asana@gate.test", "coord", ["manage_listing_fields"])
    listing = await make_listing(db_session, user.id)
    resp = await client.post(
        f"/api/v1/integrations/asana/sync/{listing.id}",
        headers=headers,
    )
    assert resp.status_code == 403


async def test_drive_organize_blocked_without_approval(client, db_session):
    user, headers = await make_user(db_session, "drive@gate.test", "coord", ["manage_listing_fields"])
    listing = await make_listing(db_session, user.id)
    resp = await client.post(
        f"/api/v1/integrations/drive/organize/{listing.id}",
        headers=headers,
    )
    assert resp.status_code == 403


async def test_wordpress_draft_blocked_without_approval(client, db_session):
    user, headers = await make_user(
        db_session, "wp@gate.test", "coord",
        ["manage_listing_fields", "publish_website"],
    )
    listing = await make_listing(db_session, user.id)
    resp = await client.post(
        f"/api/v1/integrations/wordpress/draft/{listing.id}",
        headers=headers,
    )
    assert resp.status_code == 403


async def test_gmail_send_blocked_without_approval(client, db_session):
    user, headers = await make_user(db_session, "gmail@gate.test", "coord", ["manage_listing_fields"])
    listing = await make_listing(db_session, user.id)
    message = Message(
        id=uuid.uuid4(),
        listing_id=listing.id,
        owner_user_id=user.id,
        message_type="agent_request",
        is_read=False,
    )
    db_session.add(message)
    await db_session.flush()
    resp = await client.post(
        f"/api/v1/integrations/gmail/send/{message.id}",
        headers=headers,
    )
    assert resp.status_code == 403


async def test_listing_approval_creates_approval_record(client, db_session):
    user, headers = await make_user(
        db_session, "approve@gate.test", "coord",
        ["approve_listing", "manage_listing_fields"],
    )
    listing = await make_listing(db_session, user.id, status="in_review")
    resp = await client.post(f"/api/v1/listings/{listing.id}/approve", headers=headers)
    assert resp.status_code == 200
    result = await db_session.execute(
        select(Approval).where(
            Approval.listing_id == listing.id,
            Approval.action_type == "listing_approve",
            Approval.status == "approved",
        )
    )
    approval = result.scalar_one_or_none()
    assert approval is not None


async def test_approval_decision_approve_unlocks_listing(client, db_session):
    user, headers = await make_user(
        db_session, "unlock@gate.test", "coord",
        ["approve_listing", "manage_listing_fields"],
    )
    listing = await make_listing(db_session, user.id, status="in_review")
    resp = await client.post(f"/api/v1/listings/{listing.id}/approve", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert data["locked_at"] is not None


async def test_approval_decision_writes_audit_log(client, db_session):
    user, headers = await make_user(
        db_session, "auditlog@gate.test", "coord",
        ["approve_listing", "manage_listing_fields", "view_audit_logs"],
    )
    listing = await make_listing(db_session, user.id, status="in_review")
    await client.post(f"/api/v1/listings/{listing.id}/approve", headers=headers)
    resp = await client.get(f"/api/v1/listings/{listing.id}/activity", headers=headers)
    assert resp.status_code == 200
    actions = [item["action"] for item in resp.json()["items"]]
    assert "listing.approved" in actions


async def test_pending_approval_does_not_unblock_gate(client, db_session):
    user, _ = await make_user(db_session, "pend@gate.test", "coord", [])
    listing = await make_listing(db_session, user.id)
    await _make_approval(db_session, listing.id, "fub_write", user.id, status="pending")
    with pytest.raises(HTTPException) as exc_info:
        await require_approval(db_session, listing.id, "fub_write", user.id)
    assert exc_info.value.status_code == 403


async def test_approved_approval_unblocks_gate(client, db_session):
    user, _ = await make_user(db_session, "approvd@gate.test", "coord", [])
    listing = await make_listing(db_session, user.id)
    await _make_approval(db_session, listing.id, "fub_write", user.id, status="approved")
    # Should not raise
    approval = await require_approval(db_session, listing.id, "fub_write", user.id)
    assert approval.status == "approved"


async def test_rejected_approval_blocks_gate(client, db_session):
    user, _ = await make_user(db_session, "reject@gate.test", "coord", [])
    listing = await make_listing(db_session, user.id)
    await _make_approval(db_session, listing.id, "fub_write", user.id, status="rejected")
    with pytest.raises(HTTPException) as exc_info:
        await require_approval(db_session, listing.id, "fub_write", user.id)
    assert exc_info.value.status_code == 403
