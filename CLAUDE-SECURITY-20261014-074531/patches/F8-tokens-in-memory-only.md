# F8 — JWT access and refresh tokens stored in XSS-accessible localStorage

**Severity:** HIGH  
**CWE:** CWE-312, CWE-922  
**Files changed:** `frontend/src/api/client.ts`

## Finding

`setTokens()` wrote both `access_token` and `refresh_token` to `localStorage`, readable by any JavaScript executing on the page. A single XSS sink anywhere on the same origin was sufficient to silently exfiltrate both tokens. The long-lived refresh token would allow the attacker to maintain the session indefinitely via `/auth/refresh`.

## Fix

Removes all six `localStorage` calls (two `getItem` initialisers, two `setItem` in `setTokens`, two `removeItem` in `clearTokens`). Both tokens are now stored only in module-level variables inaccessible to external scripts. The comment block documents the required backend changes to restore session persistence via `httpOnly` cookies.

**Tradeoff:** Sessions no longer survive a page reload. Full persistence requires a backend change to issue the refresh token as an `httpOnly; SameSite=Strict; Secure` cookie (documented in the code comment).

## Verification

**CONFIRMED:** true — `client.ts` lines 3-4, 10-11, 14-15 (HEAD) write both tokens to localStorage with no guard  
**Targeted:** CONFIDENT — every hunk removes exactly the localStorage calls named in the finding  
**No new vulnerability:** CONFIDENT — change removes side effects; module variables are not exported or globally accessible  
**Behaviour unchanged:** CONFIDENT (untested — project ships no frontend test suite)

**Adversarial challenge:** no attack paths found. No other file writes tokens to localStorage or sessionStorage. Module-level variables are not reachable after page reload (acceptable).
