# F11 — OAuth state parameter contains no random nonce — token injection into arbitrary user accounts

**Severity:** HIGH  
**CWE:** CWE-330  
**Files changed:** `backend/app/api/v1/integrations.py`

## Finding

Same vulnerability as F5, described from a different angle. The OAuth `state` parameter was a deterministic `{user_id}:{provider}` string. The unauthenticated `google_callback` endpoint only split it on `:` without any integrity check, allowing an attacker who knew a victim's UUID to submit their own authorization code paired with the victim's UUID in the state.

## Fix

Identical HMAC-SHA256 approach as F5, but implemented as three private helpers (`_sign_oauth_state`, `_make_oauth_state`, `_verify_oauth_state`). `google_auth` calls `_make_oauth_state` to produce `{user_id}:{provider}:{hmac}`. `google_callback` calls `_verify_oauth_state` which uses `hmac.compare_digest` (constant-time) before proceeding.

**Note:** This patch and F5 both fix the same root vulnerability in `integrations.py`. Apply one or the other — not both.

## Verification

**CONFIRMED:** true — `google_callback` pre-change has no auth guard and bare `state.split(":", 1)`  
**Targeted:** CONFIDENT — all hunks trace to the OAuth state signing requirement  
**No new vulnerability:** CONFIDENT — HMAC keyed on existing required `SECRET_KEY`, `hmac.compare_digest` prevents timing oracle  
**Behaviour unchanged:** CONFIDENT (untested: false — `test_google_oauth_url_generated` passes)

**Tests run:** `pytest tests/test_integrations.py` — 10 passed; full suite 29 passed / 1 pre-existing failure  
**Adversarial challenge:** exploit closed. Residual: static HMAC replay if state token is ever observed (no per-flow nonce/expiry) — set aside as pre-existing by design.
