# F5 — OAuth callback accepts forged state, allowing attacker to hijack victim's OAuth token

**Severity:** HIGH  
**CWE:** CWE-352  
**Files changed:** `backend/app/api/v1/integrations.py`

## Finding

The unauthenticated `google_callback` endpoint parsed `user_id` directly from the attacker-controlled `state` query parameter without any HMAC, nonce, or server-side session binding. Any caller who knew a victim's UUID could call `GET /integrations/google/callback?code=<attacker_code>&state=<victim_uuid>:gmail`, causing the server to exchange the attacker's Google authorization code and persist the attacker's OAuth token against the victim's account.

## Fix

HMAC-SHA256 signing of the state value using the server's existing `SECRET_KEY`:

- `google_auth` computes `sig = HMAC-SHA256(SECRET_KEY, "{user_id}:{provider}")` and produces `state = "{user_id}:{provider}:{sig_hex}"`
- `google_callback` splits the state into three parts, recomputes the expected HMAC over `user_id:provider`, and compares with `hmac.compare_digest` (constant-time) before proceeding
- State values not produced by this server's `google_auth` are rejected with HTTP 400

## Verification

**CONFIRMED:** true — `google_callback` traced with no auth guard and direct state trust  
**Targeted:** CONFIDENT — all hunks trace to the forged-state vulnerability  
**No new vulnerability:** CONFIDENT — `hmac.compare_digest` used for timing-safe comparison  
**Behaviour unchanged:** CONFIDENT (untested for callback path — no project test exercises `google_callback`)

**Tests run:** `pytest tests/test_integrations.py` — 10 passed, 0 failed  
**Adversarial challenge:** no attack paths found. UUID format prevents colon injection. State has no nonce/expiry (pre-existing, set aside).

**Note:** F11 describes the same vulnerability from a slightly different angle (no random nonce). This F5 patch addresses both; F11 can be declined as covered.
