import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import Role, User

pytestmark = pytest.mark.asyncio


async def _make_role(db: AsyncSession) -> Role:
    role = Role(name="listings_coordinator", description="test")
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return role


async def _make_user(db: AsyncSession, email: str = "test@example.com", password: str = "secret123") -> User:
    role = await _make_role(db)
    user = User(
        email=email,
        full_name="Test User",
        password_hash=hash_password(password),
        role_id=role.id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    response = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "secret123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    response = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "wrongpass"})
    assert response.status_code == 401


async def test_login_unknown_email(client: AsyncClient, db_session: AsyncSession):
    response = await client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "secret123"})
    assert response.status_code == 401


async def test_refresh_token(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    login = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "secret123"})
    refresh_token = login.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["refresh_token"] != refresh_token


async def test_refresh_revoked_token(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    login = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "secret123"})
    refresh_token = login.json()["refresh_token"]

    await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 401


async def test_logout(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    login = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "secret123"})
    refresh_token = login.json()["refresh_token"]

    logout = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 204

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 401


async def test_get_me(client: AsyncClient, db_session: AsyncSession):
    await _make_user(db_session)
    login = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "secret123"})
    access_token = login.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


async def test_get_me_invalid_token(client: AsyncClient, db_session: AsyncSession):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401
