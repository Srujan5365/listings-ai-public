# F7 — Password reset token is reusable: no single-use enforcement

**Severity:** HIGH  
**CWE:** CWE-640, CWE-294  
**Files changed:** `backend/alembic/versions/002_add_password_reset_tokens.py` (new), `backend/app/api/v1/auth.py`, `backend/app/models/__init__.py`, `backend/app/models/user.py`

## Finding

The password-reset JWT was never invalidated after consumption. Because no JTI blocklist existed, the same signed token could be submitted to `/reset-password` multiple times within its validity window. An attacker who obtained the reset link after the victim used it could reset the victim's password again, maintaining persistent account takeover until the JWT expired.

## Fix

Adds a `password_reset_tokens` table keyed on JTI (primary key). In `reset_password`:

1. Extracts `jti` from the payload; rejects if absent
2. Queries `password_reset_tokens` for that JTI; returns 400 if found (already used)
3. Inserts the JTI row and flushes within the same transaction before changing the password — the primary key constraint ensures a concurrent race results in an `IntegrityError` rather than a double-accept

Includes an Alembic migration (`002_add_password_reset_tokens.py`) for the new table.

## Verification

**CONFIRMED:** true — traced through `reset_password` at `auth.py:166-210` (HEAD), no JTI check present  
**Targeted:** CONFIDENT — all 4 changed paths serve the single fix  
**No new vulnerability:** CONFIDENT — purely additive; primary key prevents race-condition bypass  
**Behaviour unchanged:** CONFIDENT (untested for JTI-reuse rejection branch — no project test exercises it)

**Tests run:** `pytest tests/test_auth_full.py` — 12 passed, 0 failed; full suite 82 passed / 8 pre-existing failures (rate-limiter ordering, unrelated to this change)  
**Adversarial challenge:** no attack paths found. Race condition causes HTTP 500 (not bypass) due to primary key conflict — acceptable.
