import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.models.user import RefreshToken, User
from tests.helpers import make_user


async def _create_bare_user(db, email: str, is_active: bool = True) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        full_name="Test",
        password_hash=hash_password("Password123!"),
        is_active=is_active,
    )
    db.add(user)
    await db.flush()
    return user


async def test_login_returns_access_and_refresh_tokens(client, db_session):
    await _create_bare_user(db_session, "login@test.com")
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@test.com", "password": "Password123!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_access_token_grants_access_to_protected_route(client, db_session):
    await _create_bare_user(db_session, "me@test.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@test.com", "password": "Password123!"},
    )
    token = login.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"


async def test_expired_access_token_returns_401(client, db_session):
    user = await _create_bare_user(db_session, "expired@test.com")
    settings = get_settings()
    expired_token = jwt.encode(
        {"sub": str(user.id), "type": "access", "exp": datetime.now(timezone.utc) - timedelta(seconds=10)},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


async def test_refresh_rotation_old_token_rejected(client, db_session):
    await _create_bare_user(db_session, "rotate@test.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "rotate@test.com", "password": "Password123!"},
    )
    old_refresh = login.json()["refresh_token"]
    # First refresh — succeeds and revokes old token
    r1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r1.status_code == 200
    # Second refresh with same old token — must fail
    r2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r2.status_code == 401


async def test_logout_invalidates_refresh_token(client, db_session):
    await _create_bare_user(db_session, "logout@test.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "logout@test.com", "password": "Password123!"},
    )
    refresh = login.json()["refresh_token"]
    await client.post("/api/v1/auth/logout", json={"refresh_token": refresh})
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401


async def test_logout_without_token_is_no_op(client, db_session):
    resp = await client.post("/api/v1/auth/logout", json={"refresh_token": "made-up-garbage-token"})
    assert resp.status_code == 204


async def test_forgot_password_never_reveals_email_existence(client, db_session):
    await _create_bare_user(db_session, "real@test.com")
    r_known = await client.post("/api/v1/auth/forgot-password", json={"email": "real@test.com"})
    r_unknown = await client.post("/api/v1/auth/forgot-password", json={"email": "unknown@nowhere.com"})
    assert r_known.status_code == 200
    assert r_unknown.status_code == 200
    assert r_known.json()["message"] == r_unknown.json()["message"]


async def test_reset_password_with_valid_token(client, db_session):
    user = await _create_bare_user(db_session, "reset@test.com")
    reset_token = create_access_token({"sub": str(user.id), "purpose": "password_reset"})
    r = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "NewPassword456!"},
    )
    assert r.status_code == 204
    # Old password should no longer work
    r_old = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset@test.com", "password": "Password123!"},
    )
    assert r_old.status_code == 401
    # New password works
    r_new = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset@test.com", "password": "NewPassword456!"},
    )
    assert r_new.status_code == 200


async def test_reset_password_with_invalid_token_returns_400(client, db_session):
    resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "not.a.valid.token", "new_password": "NewPassword456!"},
    )
    assert resp.status_code == 400


async def test_reset_password_revokes_existing_refresh_tokens(client, db_session):
    user = await _create_bare_user(db_session, "revoke@test.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "revoke@test.com", "password": "Password123!"},
    )
    refresh = login.json()["refresh_token"]
    reset_token = create_access_token({"sub": str(user.id), "purpose": "password_reset"})
    await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "NewPassword789!"},
    )
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401


async def test_inactive_user_cannot_login(client, db_session):
    await _create_bare_user(db_session, "inactive@test.com", is_active=False)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@test.com", "password": "Password123!"},
    )
    assert resp.status_code == 401


async def test_concurrent_refresh_tokens_all_invalidated_on_reset(client, db_session):
    user = await _create_bare_user(db_session, "concurrent@test.com")
    login1 = await client.post(
        "/api/v1/auth/login",
        json={"email": "concurrent@test.com", "password": "Password123!"},
    )
    login2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "concurrent@test.com", "password": "Password123!"},
    )
    r1_token = login1.json()["refresh_token"]
    r2_token = login2.json()["refresh_token"]
    reset_token = create_access_token({"sub": str(user.id), "purpose": "password_reset"})
    await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "NewPasswordABC!"},
    )
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": r1_token})).status_code == 401
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": r2_token})).status_code == 401
