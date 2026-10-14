# F19 — JWT tokens persisted in localStorage, exposed to XSS

**Severity:** HIGH  
**CWE:** CWE-312  
**Files changed:** `frontend/src/api/client.ts`, `frontend/src/App.tsx`

## Finding

`setTokens()` in `client.ts` wrote both the access token and the refresh token to `localStorage`. Any JavaScript executing on the same origin via XSS could call `localStorage.getItem('access_token')` and `localStorage.getItem('refresh_token')` to exfiltrate live session credentials.

## Fix

**`client.ts`:** All six `localStorage` calls removed:
- Two `getItem` initializers at module load (lines 3-4 of HEAD)
- Two `setItem` calls inside `setTokens()`
- Two `removeItem` calls inside `clearTokens()`

Both `_accessToken` and `_refreshToken` are now pure in-memory module variables initialized to `null`. Tokens exist only for the JavaScript module's lifetime.

**`App.tsx`:** Updated the stale comment on the on-mount `useEffect` from "On mount: restore session from localStorage if token exists" to accurately reflect the new behavior: "On mount: check in-memory token — sessions do not survive page reload (tokens no longer persisted)."

**Known trade-off:** Sessions no longer survive page reloads. Users must log in again after a refresh. This is the inherent consequence of moving to in-memory-only storage. The long-term solution is httpOnly cookies managed by the server.

**Note:** This patch addresses the same root vulnerability as F8 (`F8-tokens-in-memory-only.patch`). Apply one or the other — not both. The two patches are functionally identical.

## Verification

**CONFIRMED:** true — `client.ts:3-4` (HEAD) initialize from localStorage; `client.ts:8-9` write to localStorage  
**Targeted:** CONFIDENT — all six localStorage calls removed, stale comment updated  
**No new vulnerability:** CONFIDENT — removes storage writes; no new accessor exposes tokens externally  
**Behaviour unchanged:** CONFIDENT (untested: true — no test suite in the frontend)

**Adversarial challenge:** XSS-readable storage vector fully closed — no remaining localStorage references in frontend/src. Stale comment updated to document the page-reload behavior change.
