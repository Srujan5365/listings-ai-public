# F17 — Hardcoded trivially-weak Postgres credentials in version control

**Severity:** HIGH  
**CWE:** CWE-798  
**Files changed:** `backend/docker-compose.yml`, `backend/app/core/config.py`, `backend/.env.example`

## Finding

Two separate files committed the Postgres password `listingsai` (identical to the username and database name) to version control:

1. `backend/docker-compose.yml:7` — `POSTGRES_PASSWORD: listingsai`
2. `backend/app/core/config.py:6` — `DATABASE_URL: str = "postgresql+asyncpg://listingsai:listingsai@localhost:5432/listingsai"` (default value)

Additionally, the port binding `"5432:5432"` exposed Postgres on all host interfaces, meaning anyone on the network could use these known credentials to connect directly.

## Fix

Three targeted changes:

**`backend/docker-compose.yml`:**
- `POSTGRES_PASSWORD: listingsai` → `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}`
- `POSTGRES_USER: listingsai` → `POSTGRES_USER: ${POSTGRES_USER}`
- `POSTGRES_DB: listingsai` → `POSTGRES_DB: ${POSTGRES_DB}`
- Port binding: `"5432:5432"` → `"127.0.0.1:5432:5432"` (loopback-only, per the finding's recommendation)

**`backend/app/core/config.py`:**
- `DATABASE_URL: str = "postgresql+asyncpg://listingsai:listingsai@localhost:5432/listingsai"` → `DATABASE_URL: str = ...  # type: ignore[assignment]`
- Made `DATABASE_URL` a required field (matching `SECRET_KEY`'s pattern). The application now fails at startup with a clear error if `DATABASE_URL` is absent, rather than silently using a known-weak credential.

**`backend/.env.example`:**
- Added `POSTGRES_USER=listingsai`, `POSTGRES_PASSWORD=CHANGE_ME`, `POSTGRES_DB=listingsai`
- Updated `DATABASE_URL` placeholder to use `CHANGE_ME` instead of a functional credential

**Operator action required:** Create/update `backend/.env` (already gitignored) with `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB`, and `DATABASE_URL` set to strong, unique values before running `docker-compose up`.

## Verification

**CONFIRMED:** true — `docker-compose.yml:7` and `config.py:6` (HEAD) both contain `listingsai` credential  
**Targeted:** CONFIDENT — all three hunks close the same hardcoded-credential vulnerability  
**No new vulnerability:** CONFIDENT — narrows access; `CHANGE_ME` placeholder is not a functional credential  
**Behaviour unchanged:** CONFIDENT (untested: false — 82 passing tests before and after; pre-existing 8 failures unchanged)

**Adversarial challenge:** credential-in-source-control vector fully closed (both `docker-compose.yml` and `config.py`). Pre-existing gaps: `alembic.ini` uses a generic placeholder `driver://user:pass@localhost/dbname`; `scripts/create_admin.py` reads `.env` at runtime (not a committed credential) — both set aside as unrelated.
