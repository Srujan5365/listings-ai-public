import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user, hash_password, require_permission
from app.models.user import OAuthToken, Role, User

router = APIRouter(prefix="/settings", tags=["settings"])

_auth = Depends(get_current_user)
_manage_config = Depends(require_permission("manage_configuration"))
_manage_users = Depends(require_permission("manage_users"))


@router.get("/general")
async def get_general(current_user: User = _auth):
    return {"status": "stub"}


@router.patch("/general")
async def update_general(current_user: User = Depends(require_permission("manage_configuration"))):
    return {"status": "stub"}


@router.get("/notifications")
async def get_notifications(current_user: User = _auth):
    return {"status": "stub"}


@router.patch("/notifications")
async def update_notifications(current_user: User = _auth):
    return {"status": "stub"}


@router.get("/integrations")
async def get_integrations(
    current_user: User = _auth,
    db: AsyncSession = Depends(get_db),
):
    s = get_settings()
    oauth_result = await db.execute(
        select(OAuthToken).where(OAuthToken.user_id == current_user.id)
    )
    tokens_by_provider = {t.provider: t for t in oauth_result.scalars().all()}

    def _oauth_entry(key: str, label: str) -> dict:
        token = tokens_by_provider.get(key)
        return {
            "id": key,
            "name": label,
            "connected": token is not None,
            "last_synced": token.updated_at.isoformat() if token and token.updated_at else None,
        }

    integrations = [
        _oauth_entry("gmail", "Gmail"),
        _oauth_entry("google_drive", "Google Drive"),
        {
            "id": "fub",
            "name": "Follow Up Boss",
            "connected": bool(s.FUB_API_KEY),
            "last_synced": None,
        },
        {
            "id": "asana",
            "name": "Asana",
            "connected": bool(s.ASANA_PAT),
            "last_synced": None,
        },
        {
            "id": "wordpress",
            "name": "WordPress",
            "connected": bool(s.WORDPRESS_BASE_URL and s.WORDPRESS_USERNAME),
            "last_synced": None,
        },
    ]
    return {"integrations": integrations}


@router.post("/integrations/{integration_id}/connect")
async def connect_integration(integration_id: str, current_user: User = _auth):
    return {"status": "stub"}


@router.get("/document-types")
async def list_document_types(current_user: User = _auth):
    return {"status": "stub"}


@router.post("/document-types")
async def create_document_type(
    current_user: User = Depends(require_permission("manage_configuration"))
):
    return {"status": "stub"}


@router.patch("/document-types/{dt_id}")
async def update_document_type(
    dt_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_configuration")),
):
    return {"status": "stub"}


@router.delete("/document-types/{dt_id}")
async def delete_document_type(
    dt_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_configuration")),
):
    return {"status": "stub"}


@router.get("/validation-rules")
async def list_validation_rules(current_user: User = _auth):
    return {"status": "stub"}


@router.post("/validation-rules")
async def create_validation_rule(
    current_user: User = Depends(require_permission("manage_configuration"))
):
    return {"status": "stub"}


@router.patch("/validation-rules/{rule_id}")
async def update_validation_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_configuration")),
):
    return {"status": "stub"}


@router.delete("/validation-rules/{rule_id}")
async def delete_validation_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_configuration")),
):
    return {"status": "stub"}


class UserCreateBody(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role_name: str = "listings_coordinator"

class UserUpdateBody(BaseModel):
    full_name: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/users")
async def list_users(
    search: str = "",
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(require_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    q = select(User, Role).outerjoin(Role, User.role_id == Role.id)
    if search:
        q = q.where(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()
    rows = (await db.execute(q.offset((page - 1) * page_size).limit(page_size))).all()
    items = [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": r.name if r else None,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u, r in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreateBody,
    current_user: User = Depends(require_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = (await db.execute(select(Role).where(Role.name == body.role_name))).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{body.role_name}' not found")

    user = User(
        id=uuid.uuid4(),
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role_id=role.id,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": role.name, "is_active": user.is_active}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdateBody,
    current_user: User = Depends(require_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role_name is not None:
        role = (await db.execute(select(Role).where(Role.name == body.role_name))).scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=400, detail=f"Role '{body.role_name}' not found")
        user.role_id = role.id
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name, "is_active": user.is_active}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.is_active = False
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
