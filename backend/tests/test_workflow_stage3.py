"""Stage 3 — Listing CRUD, workflow, approval gate, inbox, dashboard tests."""
import uuid
from datetime import date, timedelta, timezone, datetime

import pytest
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.listing import Listing, ListingDocument
from app.models.message import Message
from app.models.user import Permission, Role, RolePermission, User
from app.models.validation import ValidationResult


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _make_role(db, name: str) -> Role:
    result = await db.execute(select(Role).where(Role.name == name))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    role = Role(name=name, description=name)
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return role


async def _grant_permission(db, role: Role, codename: str):
    result = await db.execute(select(Permission).where(Permission.codename == codename))
    perm = result.scalar_one_or_none()
    if perm is None:
        perm = Permission(codename=codename, description=codename)
        db.add(perm)
        await db.flush()
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.role_id == role.id,
            RolePermission.permission_id == perm.id,
        )
    )
    if result.scalar_one_or_none() is None:
        db.add(RolePermission(role_id=role.id, permission_id=perm.id))
        await db.flush()


async def _make_user_with_role(db, role_name: str, extra_perms: list[str] | None = None):
    role = await _make_role(db, role_name)
    # Grant all common permissions
    for perm in [
        "manage_listing_fields",
        "manage_documents",
        "approve_listing",
        "view_audit_logs",
        "resolve_validation_conflicts",
        "prepare_treb_data",
        "request_agent_info",
    ] + (extra_perms or []):
        await _grant_permission(db, role, perm)

    email = f"{role_name}-{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        full_name=role_name,
        password_hash=hash_password("password123"),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def _listing_payload(**overrides):
    return {
        "address": "123 Main St",
        "city": "Toronto",
        "postal_code": "M5V 1A1",
        "listing_type": "freehold_sale",
        "list_price": 999000,
        "live_date": str(date.today() + timedelta(days=10)),
        "agent_name": "Jane Agent",
        "agent_email": "jane@example.com",
        **overrides,
    }


# ── Tests ─────────────────────────────────────────────────────────────────────

async def test_create_listing_success(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator")
    response = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["status"] == "received"
    assert data["address"] == "123 Main St"


async def test_create_listing_requires_auth(client, db_session):
    response = await client.post("/api/v1/listings", json=_listing_payload())
    assert response.status_code == 401


async def test_get_listing(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator2")
    create_resp = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    assert create_resp.status_code == 201
    listing_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/v1/listings/{listing_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == listing_id


async def test_list_listings_paginated(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator3")
    for i in range(3):
        r = await client.post("/api/v1/listings", json=_listing_payload(address=f"{i} Oak Ave"), headers=headers)
        assert r.status_code == 201

    resp = await client.get("/api/v1/listings?page=1&page_size=2", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3


async def test_list_listings_filter_by_status(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator4")
    r1 = await client.post("/api/v1/listings", json=_listing_payload(address="Filter A"), headers=headers)
    r2 = await client.post("/api/v1/listings", json=_listing_payload(address="Filter B"), headers=headers)
    assert r1.status_code == r2.status_code == 201

    # Manually set one to in_review
    listing_id = r1.json()["id"]
    result = await db_session.execute(select(Listing).where(Listing.id == uuid.UUID(listing_id)))
    listing = result.scalar_one()
    listing.status = "in_review"
    await db_session.flush()

    resp = await client.get("/api/v1/listings?status=in_review", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == listing_id


async def test_approve_listing(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator5")
    # Create listing and move to in_review so approval transition is valid
    r = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    listing_id = r.json()["id"]

    # Set status to in_review (valid predecessor for approved)
    result = await db_session.execute(select(Listing).where(Listing.id == uuid.UUID(listing_id)))
    listing = result.scalar_one()
    listing.status = "in_review"
    await db_session.flush()

    resp = await client.post(f"/api/v1/listings/{listing_id}/approve", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "approved"
    assert data["locked_at"] is not None


async def test_invalid_status_transition_rejected(client, db_session):
    from app.services.workflow import VALID_TRANSITIONS, transition_status
    from fastapi import HTTPException

    # received → treb_live is not a valid transition
    assert "treb_live" not in VALID_TRANSITIONS.get("received", [])

    listing = Listing(
        address="Transition Test",
        city="Toronto",
        status="received",
        priority="medium",
        treb_pass="preload",
    )
    db_session.add(listing)
    await db_session.flush()
    await db_session.refresh(listing)

    user_id = uuid.uuid4()
    with pytest.raises(HTTPException) as exc_info:
        await transition_status(db_session, listing.id, "treb_live", user_id)
    assert exc_info.value.status_code == 409


async def test_treb_copy_no_api(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator6")
    r = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    listing_id = r.json()["id"]

    resp = await client.get(f"/api/v1/listings/{listing_id}/treb-copy", headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.headers.get("x-treb-no-api") == "true"
    data = resp.json()
    assert "treb_sections" in data
    assert "treb_constants" in data
    assert data["treb_constants"]["seller_property_info_statement"] == "No"


async def test_resolve_validation(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator7")
    r = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    listing_id = r.json()["id"]

    val = ValidationResult(
        listing_id=uuid.UUID(listing_id),
        rule_id="VAL-001",
        severity="high",
        outcome="missing",
        message="Address required",
    )
    db_session.add(val)
    await db_session.flush()
    await db_session.refresh(val)

    resp = await client.patch(
        f"/api/v1/listings/{listing_id}/validations/{val.id}",
        json={"resolution_note": "Confirmed address is correct"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["resolved_at"] is not None
    assert data["outcome"] == "pass"


async def test_missing_info_creates_approval(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator8")
    r = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    listing_id = r.json()["id"]

    resp = await client.post(
        f"/api/v1/listings/{listing_id}/missing-info-requests",
        json={
            "to_email": "agent@example.com",
            "subject": "Missing documents",
            "body": "Please provide the GeoWarehouse report.",
            "field_ids": ["F-051", "F-052"],
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "pending_approval"
    assert "approval_id" in data
    assert "message_id" in data

    # Verify approval row in DB
    result = await db_session.execute(
        select(Approval).where(Approval.id == uuid.UUID(data["approval_id"]))
    )
    approval = result.scalar_one_or_none()
    assert approval is not None
    assert approval.status == "pending"
    assert approval.action_type == "email_send"


async def test_activity_log_on_create(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator9")
    r = await client.post("/api/v1/listings", json=_listing_payload(), headers=headers)
    assert r.status_code == 201
    listing_id = r.json()["id"]

    resp = await client.get(f"/api/v1/listings/{listing_id}/activity", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    actions = [item["action"] for item in data["items"]]
    assert "listing.created" in actions


async def test_inbox_unread_count(client, db_session):
    user, headers = await _make_user_with_role(db_session, "coordinator10")
    for _ in range(2):
        msg = Message(
            owner_user_id=user.id,
            message_type="system_notification",
            subject="Test",
            body="Test body",
            is_read=False,
        )
        db_session.add(msg)
    await db_session.flush()

    resp = await client.get("/api/v1/inbox/unread-count", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["count"] == 2


async def test_mark_message_read(client, db_session):
    user, headers = await _make_user_with_role(db_session, "coordinator11")
    msg = Message(
        owner_user_id=user.id,
        message_type="agent_request",
        subject="Needs reply",
        body="Please provide docs",
        is_read=False,
    )
    db_session.add(msg)
    await db_session.flush()
    await db_session.refresh(msg)

    resp = await client.patch(f"/api/v1/inbox/{msg.id}/read", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    result = await db_session.execute(select(Message).where(Message.id == msg.id))
    updated = result.scalar_one()
    assert updated.is_read is True


async def test_dashboard_metrics(client, db_session):
    _, headers = await _make_user_with_role(db_session, "coordinator12")

    # Create listings in various statuses
    statuses = ["received", "ready_for_review", "awaiting_agent", "exception", "closed"]
    for s in statuses:
        listing = Listing(
            address=f"Dash {s}",
            city="Toronto",
            status=s,
            priority="medium",
            treb_pass="preload",
        )
        db_session.add(listing)
    await db_session.flush()

    resp = await client.get("/api/v1/dashboard/metrics", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    # 4 active (received, ready_for_review, awaiting_agent, exception) + any created by prior tests
    assert data["ready_for_review"] >= 1
    assert data["awaiting_agent"] >= 1
    assert data["exceptions"] >= 1
    # closed should NOT count as active
    assert data["active_listings"] >= 4
