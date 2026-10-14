import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.listing import Listing
from app.models.user import Permission, Role, RolePermission, User


async def make_role(db: AsyncSession, name: str) -> Role:
    result = await db.execute(select(Role).where(Role.name == name))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    role = Role(id=uuid.uuid4(), name=name, description=name)
    db.add(role)
    await db.flush()
    return role


async def make_permission(db: AsyncSession, codename: str) -> Permission:
    result = await db.execute(select(Permission).where(Permission.codename == codename))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    perm = Permission(id=uuid.uuid4(), codename=codename, description=codename)
    db.add(perm)
    await db.flush()
    return perm


async def grant_permission(db: AsyncSession, role: Role, permission: Permission):
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.role_id == role.id,
            RolePermission.permission_id == permission.id,
        )
    )
    if result.scalar_one_or_none():
        return
    db.add(RolePermission(role_id=role.id, permission_id=permission.id))
    await db.flush()


async def make_user(
    db: AsyncSession,
    email: str,
    role_name: str,
    permissions: list[str] | None = None,
) -> tuple[User, dict]:
    role = await make_role(db, role_name)
    if permissions:
        for codename in permissions:
            perm = await make_permission(db, codename)
            await grant_permission(db, role, perm)
    user = User(
        id=uuid.uuid4(),
        email=email,
        full_name="Test User",
        password_hash=hash_password("Password123!"),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


async def make_listing(
    db: AsyncSession,
    created_by_id: uuid.UUID,
    status: str = "received",
    **kwargs,
) -> Listing:
    listing = Listing(
        id=uuid.uuid4(),
        internal_ref=f"TEST-{uuid.uuid4().hex[:6].upper()}",
        address=kwargs.get("address", "123 Test St"),
        city=kwargs.get("city", "Toronto"),
        postal_code=kwargs.get("postal_code", "M5V 2T6"),
        listing_type=kwargs.get("listing_type", "freehold_sale"),
        status=status,
        priority=kwargs.get("priority", "medium"),
        agent_name=kwargs.get("agent_name", "Test Agent"),
        agent_email=kwargs.get("agent_email", "agent@test.com"),
        created_by=created_by_id,
    )
    db.add(listing)
    await db.flush()
    return listing
