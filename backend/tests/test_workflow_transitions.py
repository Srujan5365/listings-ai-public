import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.audit import AuditLog
from app.services.workflow import VALID_TRANSITIONS, transition_status
from tests.helpers import make_listing, make_user

# Core forward path (non-exception/cancelled transitions)
FORWARD_PATH = [
    ("received", "splitting"),
    ("splitting", "reading"),
    ("reading", "looking_up"),
    ("looking_up", "checking"),
    ("checking", "ready_for_review"),
    ("checking", "awaiting_agent"),
    ("awaiting_agent", "reading"),
    ("ready_for_review", "in_review"),
    ("in_review", "approved"),
    ("approved", "writing"),
    ("writing", "written"),
    ("written", "treb_preloaded"),
    ("treb_preloaded", "treb_live"),
    ("treb_live", "closed"),
    ("exception", "received"),
    ("writing", "exception"),
]

# Transitions that must always be rejected
INVALID_TRANSITIONS = [
    ("received", "treb_live"),
    ("closed", "received"),
    ("approved", "received"),
    ("treb_live", "splitting"),
    ("cancelled", "writing"),
    ("writing", "received"),
]


async def test_all_valid_transitions_succeed(client, db_session):
    user, _ = await make_user(db_session, "wf@trans.test", "coordinator", [])
    for from_status, to_status in FORWARD_PATH:
        listing = await make_listing(db_session, user.id, status=from_status)
        updated = await transition_status(db_session, listing.id, to_status, user.id)
        assert updated.status == to_status, f"Expected {to_status} from {from_status}"


async def test_all_invalid_transitions_rejected(client, db_session):
    user, _ = await make_user(db_session, "inv@trans.test", "coordinator", [])
    for from_status, to_status in INVALID_TRANSITIONS:
        listing = await make_listing(db_session, user.id, status=from_status)
        with pytest.raises(HTTPException) as exc_info:
            await transition_status(db_session, listing.id, to_status, user.id)
        assert exc_info.value.status_code == 409, (
            f"Expected 409 for {from_status} → {to_status}, got {exc_info.value.status_code}"
        )


async def test_transition_writes_audit_log(client, db_session):
    user, _ = await make_user(db_session, "audit@trans.test", "coordinator", [])
    listing = await make_listing(db_session, user.id, status="received")
    await transition_status(db_session, listing.id, "splitting", user.id)
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.listing_id == listing.id,
            AuditLog.action == "listing.status.changed",
        )
    )
    log = result.scalar_one_or_none()
    assert log is not None
    assert log.old_value is not None and "received" in str(log.old_value)
    assert log.new_value is not None and "splitting" in str(log.new_value)


async def test_closed_listing_cannot_transition(client, db_session):
    user, _ = await make_user(db_session, "closed@trans.test", "coordinator", [])
    listing = await make_listing(db_session, user.id, status="closed")
    with pytest.raises(HTTPException) as exc_info:
        await transition_status(db_session, listing.id, "received", user.id)
    assert exc_info.value.status_code == 409


async def test_cancelled_listing_cannot_transition(client, db_session):
    user, _ = await make_user(db_session, "cancel@trans.test", "coordinator", [])
    listing = await make_listing(db_session, user.id, status="cancelled")
    with pytest.raises(HTTPException) as exc_info:
        await transition_status(db_session, listing.id, "writing", user.id)
    assert exc_info.value.status_code == 409


async def test_concurrent_transition_is_idempotent(client, db_session):
    user, _ = await make_user(db_session, "idem@trans.test", "coordinator", [])
    listing = await make_listing(db_session, user.id, status="received")
    # First transition succeeds
    updated = await transition_status(db_session, listing.id, "splitting", user.id)
    assert updated.status == "splitting"
    # Repeating the same target should fail (listing is now splitting, not received)
    with pytest.raises(HTTPException) as exc_info:
        await transition_status(db_session, listing.id, "splitting", user.id)
    assert exc_info.value.status_code == 409
