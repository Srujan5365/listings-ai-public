"""Seed roles and permissions

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = "000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ROLES = [
    {"name": "listings_coordinator", "description": "Listing intake and coordination"},
    {"name": "team_lead", "description": "Team leadership and oversight"},
    {"name": "reviewer", "description": "Listing review and validation"},
    {"name": "admin", "description": "Full system administration"},
]

PERMISSIONS = [
    {"codename": "view_listings", "description": "View listings"},
    {"codename": "manage_listing_fields", "description": "Manage listing fields"},
    {"codename": "manage_documents", "description": "Manage documents"},
    {"codename": "request_agent_info", "description": "Request agent information"},
    {"codename": "resolve_validation_conflicts", "description": "Resolve validation conflicts"},
    {"codename": "approve_listing", "description": "Approve listing"},
    {"codename": "prepare_treb_data", "description": "Prepare TREB data"},
    {"codename": "submit_treb", "description": "Submit to TREB (manual human action only)"},
    {"codename": "publish_website", "description": "Publish website (human action only)"},
    {"codename": "manage_users", "description": "Manage users"},
    {"codename": "manage_configuration", "description": "Manage system configuration"},
    {"codename": "view_audit_logs", "description": "View audit logs"},
]

ROLE_PERMISSIONS = {
    "listings_coordinator": [
        "view_listings",
        "manage_listing_fields",
        "manage_documents",
        "request_agent_info",
        "resolve_validation_conflicts",
        "approve_listing",
        "prepare_treb_data",
        "submit_treb",
        "publish_website",
        "view_audit_logs",
    ],
    "team_lead": [
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
        "view_audit_logs",
    ],
    "reviewer": [
        "view_listings",
        "manage_listing_fields",
        "manage_documents",
        "request_agent_info",
        "resolve_validation_conflicts",
        "approve_listing",
        "prepare_treb_data",
        "view_audit_logs",
    ],
    "admin": [
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
    ],
}


def upgrade() -> None:
    roles_table = sa.table(
        "roles",
        sa.column("id", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("created_at", sa.DateTime),
    )
    permissions_table = sa.table(
        "permissions",
        sa.column("id", sa.String),
        sa.column("codename", sa.String),
        sa.column("description", sa.String),
    )
    role_permissions_table = sa.table(
        "role_permissions",
        sa.column("role_id", sa.String),
        sa.column("permission_id", sa.String),
    )

    now = datetime.now(timezone.utc)
    role_id_map: dict[str, str] = {}
    for role in ROLES:
        rid = str(uuid.uuid4())
        role_id_map[role["name"]] = rid
        op.bulk_insert(
            roles_table,
            [{"id": rid, "name": role["name"], "description": role["description"], "created_at": now}],
        )

    perm_id_map: dict[str, str] = {}
    for perm in PERMISSIONS:
        pid = str(uuid.uuid4())
        perm_id_map[perm["codename"]] = pid
        op.bulk_insert(
            permissions_table,
            [{"id": pid, "codename": perm["codename"], "description": perm["description"]}],
        )

    for role_name, perms in ROLE_PERMISSIONS.items():
        role_id = role_id_map[role_name]
        rows = [{"role_id": role_id, "permission_id": perm_id_map[p]} for p in perms]
        op.bulk_insert(role_permissions_table, rows)


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM role_permissions"))
    conn.execute(sa.text("DELETE FROM permissions"))
    conn.execute(sa.text("DELETE FROM roles"))
