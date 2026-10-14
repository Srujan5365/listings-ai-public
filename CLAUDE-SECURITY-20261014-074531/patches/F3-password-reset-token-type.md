# F3 — Password-reset token accepted as a general API access token

**Severity:** HIGH  
**CWE:** CWE-287, CWE-640, CWE-613  
**Files changed:** `backend/app/core/security.py`, `backend/app/api/v1/auth.py`, `backend/tests/test_auth_full.py`

## Finding

`forgot_password` called `create_access_token`, which unconditionally sets `payload["type"] = "access"` on every token it mints. The resulting JWT was emailed as a password-reset link. Because `get_current_user` only checks `type == "access"` and `sub` is present, the reset token passed every authentication check and granted full API access as the target user for up to 30 minutes (the full `ACCESS_TOKEN_EXPIRE_MINUTES`, not the intended 15 minutes, because `create_access_token` ignored the `exp_minutes` data-bag key).

## Fix

Introduces a dedicated `create_password_reset_token` function in `security.py` that:
- Sets `payload["type"] = "password_reset"` (distinct from `"access"`)
- Enforces a hard-coded 15-minute expiry (no longer leaking through `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Adds a `jti` claim for future single-use enforcement

Updates `forgot_password` to call the new function. Updates `reset_password` to validate `type == "password_reset"` instead of the untyped `purpose` field.

Updates three tests in `test_auth_full.py` to use `create_password_reset_token`.

## Verification

**CONFIRMED:** true — exploit traced to `auth.py:161` + `security.py:39`  
**Targeted:** CONFIDENT — every hunk traces directly to the finding  
**No new vulnerability:** CONFIDENT — new token type rejected by unchanged `get_current_user` guard at `security.py:74`  
**Behaviour unchanged:** CONFIDENT (untested — project requires a live PostgreSQL instance to run tests)

**Adversarial challenge:** no attack paths found. Pre-existing: reset token reuse within 15-minute window (jti not checked on `reset_password`) — set aside as unrelated to this finding.
