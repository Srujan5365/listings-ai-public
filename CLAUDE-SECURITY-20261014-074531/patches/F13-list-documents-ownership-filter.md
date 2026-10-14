# F13 — list_documents exposes all documents to any authenticated user

**Severity:** HIGH  
**CWE:** CWE-862  
**Files changed:** `backend/app/api/v1/documents.py`

## Finding

`GET /api/v1/documents` built `select(ListingDocument)` with no filter on the caller's identity. Any authenticated user could page through every document in the system, receiving file names, storage paths, statuses, and document types belonging to other users.

## Fix

Adds `or_(ListingDocument.uploaded_by == current_user.id, ListingDocument.uploaded_by.is_(None))` as the base WHERE clause on the query. The `or_` branch for NULL covers orphaned documents (rows whose uploader account was deleted — the FK has `ondelete="SET NULL"`), preserving their visibility rather than silently hiding them. The count subquery derives from the already-filtered `q`, so the total count is also correctly scoped.

Also adds `or_` to the `from sqlalchemy import` statement.

## Verification

**CONFIRMED:** true — `documents.py:32` (HEAD) reads `q = select(ListingDocument)` with no ownership predicate  
**Targeted:** CONFIDENT — both hunks (import + filter) trace to the finding  
**No new vulnerability:** CONFIDENT — narrows the result set; NULL branch does not leak owned documents  
**Behaviour unchanged:** CONFIDENT (untested: true — no test in the project exercises `list_documents`)

**Adversarial challenge:** F13 exploit closed. Pre-existing: `get_document` has no ownership check — set aside as F14's domain.
