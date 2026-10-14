"""Stage 4 integration tests — all external HTTP calls are mocked."""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.models.approval import Approval
from app.models.listing import Listing
from app.models.message import Message
from app.models.user import OAuthToken, Permission, Role, RolePermission, User
from app.models.write_job import WriteJob
from app.services.integrations.gmail import GmailService
from app.services.integrations.wordpress import WordPressService


# ── helpers ────────────────────────────────────────────────────────────────────

async def _make_role_with_permissions(db, role_name: str, perms: list[str]) -> Role:
    role = Role(name=role_name)
    db.add(role)
    await db.flush()
    for codename in perms:
        perm_result = await db.execute(
            select(Permission).where(Permission.codename == codename)
        )
        perm = perm_result.scalar_one_or_none()
        if perm is None:
            perm = Permission(codename=codename, description=codename)
            db.add(perm)
            await db.flush()
        db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    await db.flush()
    return role


async def _make_user(db, role: Role, email: str = None) -> tuple[User, dict]:
    email = email or f"user_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        full_name="Test User",
        password_hash=hash_password("password"),
        role_id=role.id,
    )
    db.add(user)
    await db.flush()
    token = create_access_token({"sub": str(user.id)})
    return user, {"Authorization": f"Bearer {token}"}


async def _make_listing(db, user_id) -> Listing:
    listing = Listing(
        address="100 Test St",
        city="Toronto",
        listing_type="freehold_sale",
        status="approved",
        created_by=user_id,
    )
    db.add(listing)
    await db.flush()
    return listing


async def _make_approved_approval(db, listing_id, action_type, user_id) -> Approval:
    now = datetime.now(timezone.utc)
    approval = Approval(
        listing_id=listing_id,
        action_type=action_type,
        requested_by=user_id,
        approved_by=user_id,
        status="approved",
        payload_snapshot={},
        decided_at=now,
    )
    db.add(approval)
    await db.flush()
    return approval


# ── tests ──────────────────────────────────────────────────────────────────────

async def test_gmail_service_not_connected(db_session):
    """GmailService.is_connected() returns False when no OAuthToken exists."""
    service = GmailService(user_id=uuid.uuid4(), db=db_session)
    assert await service.is_connected() is False


async def test_gmail_send_requires_approval(client, db_session):
    """POST /integrations/gmail/send/{id} → 403 without approved Approval row."""
    role = await _make_role_with_permissions(db_session, "coord_gmail", ["manage_listing_fields"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)
    msg = Message(
        listing_id=listing.id,
        owner_user_id=user.id,
        subject="Test",
        body="Body",
        message_type="agent_request",
        to_emails=["agent@test.com"],
    )
    db_session.add(msg)
    await db_session.flush()

    resp = await client.post(f"/api/v1/integrations/gmail/send/{msg.id}", headers=headers)
    assert resp.status_code == 403


async def test_fub_sync_requires_approval(client, db_session):
    """POST /integrations/fub/sync/{id} → 403 without approved Approval row."""
    role = await _make_role_with_permissions(db_session, "coord_fub", ["manage_listing_fields"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)

    resp = await client.post(f"/api/v1/integrations/fub/sync/{listing.id}", headers=headers)
    assert resp.status_code == 403


async def test_asana_sync_requires_approval(client, db_session):
    """POST /integrations/asana/sync/{id} → 403 without approved Approval row."""
    role = await _make_role_with_permissions(db_session, "coord_asana", ["manage_listing_fields"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)

    resp = await client.post(f"/api/v1/integrations/asana/sync/{listing.id}", headers=headers)
    assert resp.status_code == 403


async def test_drive_organize_requires_approval(client, db_session):
    """POST /integrations/drive/organize/{id} → 403 without approved Approval row."""
    role = await _make_role_with_permissions(db_session, "coord_drive", ["manage_listing_fields"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)

    resp = await client.post(f"/api/v1/integrations/drive/organize/{listing.id}", headers=headers)
    assert resp.status_code == 403


async def test_wordpress_draft_requires_approval(client, db_session):
    """POST /integrations/wordpress/draft/{id} → 403 without approved Approval row."""
    role = await _make_role_with_permissions(db_session, "coord_wp", ["publish_website"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)

    resp = await client.post(f"/api/v1/integrations/wordpress/draft/{listing.id}", headers=headers)
    assert resp.status_code == 403


async def test_wordpress_publish_always_403():
    """WordPressService.publish() always raises 403 — no bypass possible."""
    from fastapi import HTTPException
    wp = WordPressService()
    with pytest.raises(HTTPException) as exc_info:
        await wp.publish(post_id=1)
    assert exc_info.value.status_code == 403
    assert "human action" in exc_info.value.detail.lower()


async def test_treb_has_no_write_endpoint():
    """No route exists for TREB submit, publish, or push."""
    from app.main import app
    treb_write_routes = [
        r for r in app.routes
        if hasattr(r, "path") and "treb" in r.path.lower()
        and any(w in r.path.lower() for w in ("submit", "publish", "push", "send"))
    ]
    assert len(treb_write_routes) == 0, f"Found unexpected TREB write routes: {treb_write_routes}"


async def test_google_oauth_url_generated(client, db_session):
    """GET /integrations/google/auth?provider=gmail returns a Google OAuth URL."""
    role = await _make_role_with_permissions(db_session, "coord_oauth", ["manage_listing_fields"])
    _, headers = await _make_user(db_session, role)

    resp = await client.get("/api/v1/integrations/google/auth?provider=gmail", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "auth_url" in data
    assert data["auth_url"].startswith("https://accounts.google.com/")


async def test_write_job_created_on_successful_fub_sync(client, db_session):
    """Successful FUB sync (mocked HTTP) creates a WriteJob row with status='success'."""
    role = await _make_role_with_permissions(db_session, "coord_fub2", ["manage_listing_fields"])
    user, headers = await _make_user(db_session, role)
    listing = await _make_listing(db_session, user.id)
    await _make_approved_approval(db_session, listing.id, "fub_write", user.id)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "people": [{"id": 42, "name": "Test Client"}]
    }

    mock_deal_response = MagicMock()
    mock_deal_response.status_code = 201
    mock_deal_response.json.return_value = {"deal": {"id": 99}}

    mock_note_response = MagicMock()
    mock_note_response.status_code = 201
    mock_note_response.json.return_value = {"note": {"id": 1}}

    call_count = 0

    async def mock_request_side_effect(method, url, **kwargs):
        nonlocal call_count
        call_count += 1
        if "people" in url and method == "GET":
            return mock_response
        if "deals" in url:
            return mock_deal_response
        if "notes" in url:
            return mock_note_response
        return mock_response

    with patch("httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.request = AsyncMock(side_effect=mock_request_side_effect)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        resp = await client.post(
            f"/api/v1/integrations/fub/sync/{listing.id}", headers=headers
        )

    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "synced"

    job_result = await db_session.execute(
        select(WriteJob).where(
            WriteJob.listing_id == listing.id,
            WriteJob.target == "fub",
        )
    )
    job = job_result.scalar_one_or_none()
    assert job is not None
    assert job.status == "success"
