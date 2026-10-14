import uuid
from datetime import datetime, timezone

import pytest

from app.models.audit import AuditLog, _block_audit_delete, _block_audit_update
from app.services.audit import log_action
from tests.helpers import make_listing, make_user


def _new_log(**kwargs) -> AuditLog:
    return AuditLog(
        id=uuid.uuid4(),
        action=kwargs.get("action", "test.action"),
        entity_type=kwargs.get("entity_type", "test"),
        entity_id=kwargs.get("entity_id", str(uuid.uuid4())),
        old_value=kwargs.get("old_value"),
        new_value=kwargs.get("new_value"),
        ip_address=kwargs.get("ip_address", "127.0.0.1"),
    )


async def test_audit_log_insert_succeeds(client, db_session):
    log = _new_log(action="test.insert")
    db_session.add(log)
    await db_session.flush()
    from sqlalchemy import select
    result = await db_session.execute(select(AuditLog).where(AuditLog.id == log.id))
    assert result.scalar_one_or_none() is not None


async def test_audit_log_update_raises_runtime_error(client, db_session):
    log = _new_log(action="test.before_update")
    db_session.add(log)
    await db_session.flush()
    # Trigger the before_update event listener directly
    with pytest.raises(RuntimeError, match="INSERT-only"):
        _block_audit_update(None, None, log)


async def test_audit_log_delete_raises_runtime_error(client, db_session):
    log = _new_log(action="test.before_delete")
    db_session.add(log)
    await db_session.flush()
    # Trigger the before_delete event listener directly
    with pytest.raises(RuntimeError, match="INSERT-only"):
        _block_audit_delete(None, None, log)


async def test_audit_log_captures_listing_creation(client, db_session):
    user, headers = await make_user(
        db_session, "audit_create@imm.test", "coord",
        ["manage_listing_fields"],
    )
    resp = await client.post(
        "/api/v1/listings",
        json={
            "address": "99 Audit St",
            "city": "Toronto",
            "postal_code": "M5V1A1",
            "listing_type": "freehold_sale",
            "list_price": 999000,
            "live_date": "2026-12-01",
            "agent_name": "Audit Agent",
            "agent_email": "audit@agent.com",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    listing_id = resp.json()["id"]

    activity_resp = await client.get(
        f"/api/v1/listings/{listing_id}/activity",
        headers=headers,
    )
    assert activity_resp.status_code == 200
    items = activity_resp.json()["items"]
    actions = [i["action"] for i in items]
    assert "listing.created" in actions

    matching = [i for i in items if i["action"] == "listing.created"]
    assert matching[0]["entity_type"] == "listing"


async def test_audit_log_captures_status_change(client, db_session):
    user, _ = await make_user(db_session, "audit_status@imm.test", "coord", [])
    listing = await make_listing(db_session, user.id, status="received")
    from app.services.workflow import transition_status
    await transition_status(db_session, listing.id, "splitting", user.id)

    from sqlalchemy import select
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.listing_id == listing.id,
            AuditLog.action == "listing.status.changed",
        )
    )
    log = result.scalar_one_or_none()
    assert log is not None
    assert log.old_value is not None
    assert "received" in str(log.old_value)
    assert log.new_value is not None
    assert "splitting" in str(log.new_value)


async def test_audit_log_captures_approval(client, db_session):
    user, headers = await make_user(
        db_session, "audit_approve@imm.test", "coord",
        ["approve_listing", "manage_listing_fields"],
    )
    listing = await make_listing(db_session, user.id, status="in_review")
    resp = await client.post(f"/api/v1/listings/{listing.id}/approve", headers=headers)
    assert resp.status_code == 200

    from sqlalchemy import select
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.listing_id == listing.id,
            AuditLog.action == "listing.approved",
        )
    )
    log = result.scalar_one_or_none()
    assert log is not None
