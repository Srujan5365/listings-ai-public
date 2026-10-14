# F16 — COPY . . bakes .env secrets into Docker image layer

**Severity:** HIGH  
**CWE:** CWE-312  
**Files changed:** `backend/.dockerignore` (new file)

## Finding

`backend/Dockerfile` runs `COPY . .` with no `.dockerignore` present. If `.env` is present in the build context at `docker build` time, every secret is embedded in a Docker image layer and can be extracted by anyone with image access via `docker save` / layer tar inspection.

## Fix

Creates `backend/.dockerignore` containing exactly three lines that cover all common `.env` filename variants:
- `.env` — exact match for the base secrets file
- `*.env` — variants like `production.env`, `dev.env`
- `.env.*` — variants like `.env.local`, `.env.production`, `.env.development`

The file is minimal — only the entries needed to close the finding.

## Verification

**CONFIRMED:** true — `backend/.dockerignore` did not exist at HEAD; `backend/Dockerfile:5` runs `COPY . .`  
**Targeted:** CONFIDENT — file contains only the three env-pattern exclusions  
**No new vulnerability:** CONFIDENT — additive exclusion only; narrows the build context  
**Behaviour unchanged:** CONFIDENT (untested: true — no project test exercises Docker build config)

**Adversarial challenge:** exploit closed. Pre-existing gaps noted: `alembic.ini` and `scripts/` are not excluded — set aside as unrelated and lower-risk.
