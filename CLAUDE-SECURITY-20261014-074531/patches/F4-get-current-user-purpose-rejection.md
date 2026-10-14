# F4 — Password-reset JWT accepted as bearer access token on any authenticated endpoint

**Severity:** HIGH  
**CWE:** CWE-287, CWE-613  
**Files changed:** `backend/app/core/security.py`

## Finding

`create_access_token` unconditionally set `type: "access"` on every token it minted, including password-reset tokens (which also carried `purpose: "password_reset"`). `get_current_user` at `security.py:74` only validated `type == "access"`; it never checked for `purpose`, so any password-reset token was a fully valid bearer token for every protected endpoint.

## Fix

One-line addition to the guard in `get_current_user`:

```python
if payload is None or payload.get("type") != "access" or payload.get("purpose") is not None:
    raise credentials_exception
```

Any token whose payload carries a `purpose` claim is now rejected as a bearer token. Normal login and refresh tokens carry no `purpose` field and are unaffected.

## Verification

**CONFIRMED:** true — traced through `auth.py:161-163` → `security.py:39` → `security.py:74`  
**Targeted:** CONFIDENT — single line, single file, traces entirely to F4  
**No new vulnerability:** CONFIDENT — purely additive restriction; `purpose` is HMAC-protected, cannot be injected  
**Behaviour unchanged:** CONFIDENT (untested — project requires a live PostgreSQL instance to run tests)

**Adversarial challenge:** no attack paths found. Pre-existing: `exp_minutes` key silently ignored by `create_access_token` — set aside as unrelated to this finding.
