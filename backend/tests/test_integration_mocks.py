import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.encryption import encrypt
from app.models.listing import ExtractedField
from app.models.user import OAuthToken
from app.services.integrations.asana import AsanaService
from app.services.integrations.drive import DriveService
from app.services.integrations.fub import FUBService
from app.services.integrations.gmail import GmailService
from app.services.integrations.wordpress import WordPressService
from tests.helpers import make_listing, make_user


def _make_async_cm(return_value):
    """Return a mock usable as `async with ... as x`."""
    mock = AsyncMock()
    mock.__aenter__ = AsyncMock(return_value=return_value)
    mock.__aexit__ = AsyncMock(return_value=None)
    return mock


def _mock_response(status_code: int, json_data: dict) -> MagicMock:
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data
    return resp


async def test_gmail_send_email_builds_correct_request(client, db_session):
    user, _ = await make_user(db_session, "gsend@mock.test", "coord", [])
    service = GmailService(user.id, db_session)

    send_resp = _mock_response(200, {"id": "msg1", "threadId": "thr1"})
    mock_client = _make_async_cm(AsyncMock(post=AsyncMock(return_value=send_resp)))

    with patch.object(service, "get_access_token", new=AsyncMock(return_value="fake-access-token")):
        with patch("app.services.integrations.gmail.httpx.AsyncClient", return_value=mock_client):
            result = await service.send_email("to@example.com", "Test Subject", "Hello body")

    assert result["message_id"] == "msg1"
    assert result["thread_id"] == "thr1"
    mock_client.__aenter__.return_value.post.assert_called_once()
    call_kwargs = mock_client.__aenter__.return_value.post.call_args
    assert "gmail.googleapis.com" in call_kwargs[0][0]
    headers = call_kwargs[1].get("headers", {})
    assert headers.get("Authorization") == "Bearer fake-access-token"
    body = call_kwargs[1].get("json", {})
    assert "raw" in body  # base64url-encoded message


async def test_gmail_token_refresh_called_when_expired(client, db_session):
    user, _ = await make_user(db_session, "grefresh@mock.test", "coord", [])
    expired_token = OAuthToken(
        id=uuid.uuid4(),
        user_id=user.id,
        provider="gmail",
        access_token_enc=encrypt("old-access-token"),
        refresh_token_enc=encrypt("my-refresh-token"),
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        scopes=["gmail.send"],
    )
    db_session.add(expired_token)
    await db_session.flush()

    service = GmailService(user.id, db_session)
    refresh_resp = _mock_response(200, {"access_token": "new-access-token", "expires_in": 3600})
    mock_client = _make_async_cm(AsyncMock(post=AsyncMock(return_value=refresh_resp)))

    with patch("app.services.integrations.gmail.httpx.AsyncClient", return_value=mock_client):
        token = await service.get_access_token()

    assert token == "new-access-token"
    mock_client.__aenter__.return_value.post.assert_called_once()
    assert expired_token.expires_at > datetime.now(timezone.utc)  # updated


async def test_fub_sync_maps_correct_fields(client, db_session):
    user, _ = await make_user(db_session, "fubsync@mock.test", "coord", [])
    listing = await make_listing(db_session, user.id)
    for fid, val in [("F-005", "John Seller"), ("F-007", "416-555-0100"), ("F-008", "john@seller.com")]:
        db_session.add(ExtractedField(
            id=uuid.uuid4(), listing_id=listing.id,
            field_id=fid, value=val, status="confirmed",
        ))
    await db_session.flush()

    service = FUBService()
    find_mock = AsyncMock(return_value={"id": 1, "name": "John Seller", "email": "john@seller.com"})
    deal_mock = AsyncMock(return_value={"id": 42})
    note_mock = AsyncMock(return_value={})

    with patch.object(service, "find_or_create_person", find_mock), \
         patch.object(service, "create_deal", deal_mock), \
         patch.object(service, "add_audit_note", note_mock):
        result = await service.sync_listing(listing.id, db_session)
        assert result["person_id"] == 1
        assert result["deal_id"] == 42
        find_mock.assert_called_once_with("john@seller.com", "John Seller", "416-555-0100")


async def test_fub_retries_on_429(client, db_session):
    service = FUBService()
    resp_429 = _mock_response(429, {})
    resp_200 = _mock_response(200, {"result": "ok"})
    mock_client_inner = AsyncMock()
    mock_client_inner.request = AsyncMock(side_effect=[resp_429, resp_200])
    mock_cm = _make_async_cm(mock_client_inner)

    with patch("app.services.integrations.fub.httpx.AsyncClient", return_value=mock_cm):
        with patch("app.services.integrations.fub.asyncio.sleep", new=AsyncMock()):
            result = await service._request("GET", "/test")

    assert mock_client_inner.request.call_count == 2
    assert result == {"result": "ok"}


async def test_asana_creates_task_with_correct_fields(client, db_session):
    user, _ = await make_user(db_session, "asana@mock.test", "coord", [])
    listing = await make_listing(db_session, user.id)

    service = AsanaService()
    task_resp = {"gid": "task123", "permalink_url": "https://app.asana.com/task123"}
    task_mock = AsyncMock(return_value=task_resp)

    with patch.object(service, "create_task", task_mock):
        result = await service.sync_listing(listing.id, db_session)
        assert result["task_gid"] == "task123"
        task_mock.assert_called_once()
        call_args = task_mock.call_args
        task_data = call_args[0][1]  # second positional arg: (project_gid, task_data)
        assert "name" in task_data
        assert listing.internal_ref in task_data["name"]


async def test_wordpress_create_draft_sends_status_draft(client, db_session):
    user, _ = await make_user(db_session, "wp@mock.test", "coord", [])
    listing = await make_listing(db_session, user.id)

    service = WordPressService()
    captured = {}

    async def fake_post(url, json=None, auth=None, **kwargs):
        captured.update(json or {})
        return _mock_response(201, {"id": 99, "link": "http://example.com/p/1", "status": "draft"})

    mock_inner = AsyncMock(post=fake_post)
    mock_cm = _make_async_cm(mock_inner)

    with patch("app.services.integrations.wordpress.httpx.AsyncClient", return_value=mock_cm):
        result = await service.create_draft(listing.id, db_session)

    assert captured.get("status") == "draft"
    assert captured.get("status") != "publish"
    assert result["post_id"] == 99


async def test_wordpress_publish_unconditionally_raises_403(client, db_session):
    service = WordPressService()
    called = []

    async def spy_post(*args, **kwargs):
        called.append(True)
        return _mock_response(200, {})

    with patch("app.services.integrations.wordpress.httpx.AsyncClient") as mock_cls:
        mock_cls.return_value = _make_async_cm(AsyncMock(post=spy_post))
        with pytest.raises(HTTPException) as exc_info:
            await service.publish(post_id=1)

    assert exc_info.value.status_code == 403
    assert len(called) == 0  # No HTTP call made


async def test_drive_organize_creates_three_subfolders(client, db_session):
    user, _ = await make_user(db_session, "drive@mock.test", "coord", [])
    listing = await make_listing(db_session, user.id, internal_ref="DRV-001")

    service = DriveService(user.id, db_session)
    folder_calls = []
    call_idx = [0]

    async def fake_create_folder(name, parent_id=None):
        folder_calls.append(name)
        call_idx[0] += 1
        return {"id": f"folder-{call_idx[0]}", "webViewLink": f"http://drive/folder-{call_idx[0]}"}

    with patch.object(service, "create_folder", side_effect=fake_create_folder):
        result = await service.organize_listing(listing.id, "DRV-001")

    assert len(folder_calls) == 4  # root + 3 subfolders
    assert "root_folder_id" in result
    assert "source_docs_id" in result
    assert "processed_id" in result
    assert "evidence_id" in result
    assert "source_docs" in folder_calls
    assert "processed" in folder_calls
    assert "evidence" in folder_calls


async def test_gmail_not_connected_returns_false(client, db_session):
    user, _ = await make_user(db_session, "gnoconn@mock.test", "coord", [])
    service = GmailService(user.id, db_session)
    connected = await service.is_connected()
    assert connected is False


async def test_drive_not_connected_returns_false(client, db_session):
    user, _ = await make_user(db_session, "dnoconn@mock.test", "coord", [])
    service = DriveService(user.id, db_session)
    connected = await service.is_connected()
    assert connected is False
