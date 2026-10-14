# F18 — Refresh Token Never Revoked on Logout

**Severity:** HIGH  
**CWE:** CWE-613  
**Files changed:** `frontend/src/App.tsx`, `frontend/src/api/client.ts`

## Finding

`handleLogout` in `App.tsx` called only `clearTokens()` (clears in-memory tokens), but never called the `logout(refreshToken)` function from `auth.ts`. That function POSTs to `POST /api/v1/auth/logout` which marks the refresh token as `revoked_at` in the database. Because this call was omitted, a stolen refresh token remained permanently valid even after the victim clicked Log Out.

The session-expiry path (`auth:logout` event handler, `App.tsx:64-73`) had the same gap.

## Fix

Three targeted changes across two files:

**`frontend/src/api/client.ts`:**
- Exports `getRefreshToken()` (mirrors `getAccessToken()`) so `handleLogout` can read the current in-memory refresh token.
- Captures `expiredRefreshToken = _refreshToken` before calling `refreshAccessToken()` (which may clear it), then dispatches `CustomEvent('auth:logout', { detail: { refreshToken: expiredRefreshToken } })` instead of a plain `Event`. This passes the token to the session-expiry handler without a storage read after clearing.

**`frontend/src/App.tsx`:**
- `handleLogout`: reads the current refresh token via `getRefreshToken()`, then calls `logout(refreshToken)` which POSTs to `/auth/logout` server-side and calls `clearTokens()` in its `finally` block regardless of network outcome.
- `auth:logout` event handler: casts event to `CustomEvent` to extract `detail.refreshToken`, calls `logout(refreshToken)` when available. Falls back to `clearTokens()` when no token is present.

Note: `POST /auth/logout` on the backend does not require an Authorization header — it revokes by token hash alone — so the revocation call succeeds correctly even after tokens are cleared.

## Verification

**CONFIRMED:** true — `App.tsx:81` (HEAD) `handleLogout` calls only `clearTokens()`, never `logout()`  
**Targeted:** CONFIDENT — all hunks trace to the F18 revocation requirement  
**No new vulnerability:** CONFIDENT — no attack surface widened; `getRefreshToken()` exposes nothing not already in module state  
**Behaviour unchanged:** CONFIDENT (untested: true — frontend has no test suite)

**Adversarial challenge:** handleLogout exploit closed. Session-expiry path also closed (backend endpoint works without auth header). Pre-existing gap: on-mount non-401 network failure calls `clearTokens()` without revocation — set aside as a separate infrastructure scenario.
