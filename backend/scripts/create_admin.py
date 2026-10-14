"""Run once to create the first admin user: python3 scripts/create_admin.py"""
import asyncio, os, uuid, sys
from pathlib import Path

for line in (Path(__file__).parent.parent / ".env").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.models.user import User, Role
from app.core.security import hash_password
from datetime import datetime, timezone


async def main():
    email = input("Admin email: ").strip()
    full_name = input("Full name: ").strip()
    password = input("Password (min 8 chars): ").strip()

    if len(password) < 8:
        print("Password must be at least 8 characters")
        return

    engine = create_async_engine(os.environ["DATABASE_URL"], echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"User {email} already exists")
            await engine.dispose()
            return

        role_result = await db.execute(select(Role).where(Role.name == "admin"))
        role = role_result.scalar_one_or_none()
        if not role:
            print("Admin role not found — run seed first")
            await engine.dispose()
            return

        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role_id=role.id,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        print(f"\nAdmin user created: {email}")
        print("You can now log in at http://localhost:8000")

    await engine.dispose()


asyncio.run(main())
