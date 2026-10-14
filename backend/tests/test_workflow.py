import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval
from app.models.listing import Listing
from app.services import approval_gate, workflow

pytestmark = pytest.mark.asyncio


async def _make_listing(db: AsyncSession, status: str = "received") -> Listing:
    listing = Listing(status=status, priority="medium", treb_pass="preload")
    db.add(listing)
    await db.flush()
    await db.refresh(listing)
    return listing


async def test_valid_transition(db_session: AsyncSession):
    listing = await _make_listing(db_session, status="received")
    updated = await workflow.transition_status(db_session, listing.id, "splitting", None)
    assert updated.status == "splitting"


async def test_invalid_transition(db_session: AsyncSession):
    listing = await _make_listing(db_session, status="received")
    with pytest.raises(HTTPException) as exc_info:
        await workflow.transition_status(db_session, listing.id, "treb_live", None)
    assert exc_info.value.status_code == 409


async def test_approval_gate_blocks_without_approval(db_session: AsyncSession):
    listing = await _make_listing(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await approval_gate.require_approval(
            db_session, listing.id, "asana_write", uuid.uuid4()
        )
    assert exc_info.value.status_code == 403


async def test_approval_gate_passes_with_approval(db_session: AsyncSession):
    listing = await _make_listing(db_session)
    approver_id = uuid.uuid4()
    requester_id = uuid.uuid4()

    approval = Approval(
        listing_id=listing.id,
        action_type="asana_write",
        requested_by=requester_id,
        approved_by=approver_id,
        status="approved",
    )
    db_session.add(approval)
    await db_session.flush()

    result = await approval_gate.require_approval(
        db_session, listing.id, "asana_write", approver_id
    )
    assert result.status == "approved"
