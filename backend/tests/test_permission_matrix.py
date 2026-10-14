import uuid

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, require_permission
from app.models.user import User
from tests.helpers import grant_permission, make_permission, make_role, make_user

ALL_PERMISSIONS = [
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

ROLE_PERMISSIONS = {
    "listings_coordinator": [
        "view_listings", "manage_listing_fields", "manage_documents",
        "request_agent_info", "resolve_validation_conflicts", "approve_listing",
        "prepare_treb_data", "submit_treb", "publish_website", "view_audit_logs",
    ],
    "team_lead": [
        "view_listings", "manage_listing_fields", "manage_documents",
        "request_agent_info", "resolve_validation_conflicts", "approve_listing",
        "prepare_treb_data", "submit_treb", "publish_website",
        "manage_users", "view_audit_logs",
    ],
    "reviewer": [
        "view_listings", "manage_listing_fields", "manage_documents",
        "request_agent_info", "resolve_validation_conflicts", "approve_listing",
        "prepare_treb_data", "view_audit_logs",
    ],
    "admin": ALL_PERMISSIONS,
}


async def _check_permission(db, user, codename: str) -> bool:
    checker = require_permission(codename)
    try:
        await checker(current_user=user, db=db)
        return True
    except HTTPException as e:
        if e.status_code == 403:
            return False
        raise


async def test_listings_coordinator_permissions(client, db_session):
    allowed = ROLE_PERMISSIONS["listings_coordinator"]
    denied = [p for p in ALL_PERMISSIONS if p not in allowed]
    user, _ = await make_user(db_session, "coord@perm.test", "listings_coordinator", allowed)
    for codename in allowed:
        assert await _check_permission(db_session, user, codename), f"Expected allow: {codename}"
    for codename in denied:
        assert not await _check_permission(db_session, user, codename), f"Expected deny: {codename}"


async def test_team_lead_permissions(client, db_session):
    allowed = ROLE_PERMISSIONS["team_lead"]
    denied = [p for p in ALL_PERMISSIONS if p not in allowed]
    user, _ = await make_user(db_session, "lead@perm.test", "team_lead", allowed)
    for codename in allowed:
        assert await _check_permission(db_session, user, codename), f"Expected allow: {codename}"
    for codename in denied:
        assert not await _check_permission(db_session, user, codename), f"Expected deny: {codename}"


async def test_reviewer_permissions(client, db_session):
    allowed = ROLE_PERMISSIONS["reviewer"]
    denied = [p for p in ALL_PERMISSIONS if p not in allowed]
    user, _ = await make_user(db_session, "rev@perm.test", "reviewer", allowed)
    for codename in allowed:
        assert await _check_permission(db_session, user, codename), f"Expected allow: {codename}"
    for codename in denied:
        assert not await _check_permission(db_session, user, codename), f"Expected deny: {codename}"


async def test_admin_has_all_permissions(client, db_session):
    user, _ = await make_user(db_session, "admin@perm.test", "admin", ALL_PERMISSIONS)
    for codename in ALL_PERMISSIONS:
        assert await _check_permission(db_session, user, codename), f"Admin should have: {codename}"


async def test_no_role_blocks_all_permissions(client, db_session):
    from app.core.security import hash_password
    user = User(
        id=uuid.uuid4(),
        email="norole@perm.test",
        full_name="No Role",
        password_hash=hash_password("Password123!"),
        role_id=None,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    for codename in ALL_PERMISSIONS:
        assert not await _check_permission(db_session, user, codename), f"Should deny (no role): {codename}"


async def test_role_without_permission_blocks(client, db_session):
    user, _ = await make_user(db_session, "empty@perm.test", "empty_role", permissions=[])
    for codename in ALL_PERMISSIONS:
        assert not await _check_permission(db_session, user, codename), f"Should deny (no perms): {codename}"
