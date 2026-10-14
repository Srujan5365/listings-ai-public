# F15 — update_user allows manage_users holder to escalate their own role

**Severity:** HIGH  
**CWE:** CWE-269  
**Files changed:** `backend/app/models/user.py`, `backend/alembic/versions/002_add_role_privilege_level.py`, `backend/app/api/v1/settings.py`, `backend/tests/test_permissions.py`

## Finding

`PATCH /api/v1/settings/users/{user_id}` accepted arbitrary `role_name` and wrote it to any user's `role_id` with no identity or hierarchy check. A `manage_users` holder could call this endpoint with their own UUID and `{"role_name": "admin"}`, immediately granting themselves full system access.

## Fix

Implements a proper privilege hierarchy in four parts:

**`backend/app/models/user.py`:**  
`Role` model gains `privilege_level: Mapped[int]` (Integer, `server_default="0"`).

**`backend/alembic/versions/002_add_role_privilege_level.py`:**  
Migration adds the column with default 0 and sets initial levels:
- `admin`: 100
- `team_lead`: 50
- `reviewer`: 25
- `listings_coordinator`: 10

**`backend/app/api/v1/settings.py` — `update_user`:**  
When `user.id == current_user.id`, the handler loads the caller's current role's `privilege_level` from the database (fresh read, not from JWT) and the target role's `privilege_level`. If `target_role.privilege_level >= caller_level`, raises HTTP 403. This means:
- Self-escalation (team_lead → admin: 100 ≥ 50): **BLOCKED** ✓
- Self-maintenance (team_lead → team_lead: 50 ≥ 50): **BLOCKED** ✓  
- Self-demotion (team_lead → reviewer: 25 < 50): **ALLOWED** ✓ (preserves prior behavior)
- Other-user updates: **UNCHANGED** ✓

**`backend/tests/test_permissions.py`:**  
Two new tests: `test_self_escalation_blocked` (expects 403) and `test_self_demotion_allowed` (expects 200).

## Note on partial coverage

This patch closes the self-escalation path. The broader gap — a `manage_users` holder escalating another user's account (cross-user privilege assignment) — remains. A `team_lead` can still promote anyone else to `admin`. Full closure requires extending the hierarchy check to the other-user path, which is tracked separately.

## Verification

**CONFIRMED:** true — `settings.py:237` (HEAD) writes `user.role_id = role.id` with no self-check or hierarchy  
**Targeted:** CONFIDENT — model, migration, handler, and tests all trace to F15  
**No new vulnerability:** CONFIDENT — guard fires only when `user.id == current_user.id`; re-fetches role from DB so stale JWT cannot bypass  
**Behaviour unchanged:** CONFIDENT (untested: false — 5 tests pass including both new tests; 82 suite tests pass)

**Tests run:** `pytest tests/test_permissions.py` — 5 passed; full suite — 82 passed, 10 pre-existing failures (slowapi rate-limiter cross-test interference, unrelated to this patch).
