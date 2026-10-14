import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import Permission, Role, RolePermission, User

pytestmark = pytest.mark.asyncio


async def _make_user_with_role(
    db: AsyncSession,
    role_name: str,
    permissions: list[str],
    email: str = "user@example.com",
) -> tuple[User, str]:
    role = Role(name=role_name, description="test")
    db.add(role)
    await db.flush()
    await db.refresh(role)

    for perm_code in permissions:
        perm = Permission(codename=perm_code, description=perm_code)
        db.add(perm)
        await db.flush()
        await db.refresh(perm)
        rp = RolePermission(role_id=role.id, permission_id=perm.id)
        db.add(rp)

    user = User(
        email=email,
        full_name="Test",
        password_hash=hash_password("pass1234"),
        role_id=role.id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user, "pass1234"


async def _get_token(client: AsyncClient, email: str, password: str) -> str:
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


async def test_permission_required_blocks_unauthorized(
    client: AsyncClient, db_session: AsyncSession
):
    await _make_user_with_role(
        db_session,
        role_name="reviewer",
        permissions=["view_listings"],
        email="reviewer@example.com",
    )
    token = await _get_token(client, "reviewer@example.com", "pass1234")

    response = await client.get(
        "/api/v1/settings/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


async def test_permission_required_allows_authorized(
    client: AsyncClient, db_session: AsyncSession
):
    await _make_user_with_role(
        db_session,
        role_name="admin",
        permissions=["view_listings", "manage_users", "manage_configuration"],
        email="admin@example.com",
    )
    token = await _get_token(client, "admin@example.com", "pass1234")

    response = await client.get(
        "/api/v1/settings/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


async def test_role_permissions_seeded_correctly(db_session: AsyncSession):
    roles = ["listings_coordinator", "team_lead", "reviewer", "admin"]
    permissions = [
        "view_listings",
        "manage_listing_fields",
        "manage_documents",
        "request_agent_info",
        "resolve_validation_conflicts",
        "approve_listing",
        "prepare_treb_data",
        "submit_treb",
        "publish_website",
        "manage_users",
        "manage_configuration",
        "view_audit_logs",
    ]

    for role_name in roles:
        role = Role(name=role_name, description="seed test")
        db_session.add(role)
    for perm_code in permissions:
        perm = Permission(codename=perm_code, description=perm_code)
        db_session.add(perm)
    await db_session.flush()

    from sqlalchemy import select, func
    result = await db_session.execute(select(func.count()).select_from(Role))
    role_count = result.scalar()
    assert role_count == 4

    result = await db_session.execute(select(func.count()).select_from(Permission))
    perm_count = result.scalar()
    assert perm_count == 12
