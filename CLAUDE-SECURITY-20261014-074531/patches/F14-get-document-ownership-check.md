# F14 — get_document fetches any document by UUID with no ownership check (IDOR)

**Severity:** HIGH  
**CWE:** CWE-639  
**Files changed:** `backend/app/api/v1/documents.py`

## Finding

`GET /api/v1/documents/{document_id}` resolved `document_id` against `ListingDocument.id` without any ownership predicate. Any authenticated user who knew or guessed a document UUID could retrieve the full metadata record for any document in the system.

## Fix

Adds `ListingDocument.uploaded_by == current_user.id` as a second WHERE predicate in the `select(ListingDocument)` query. If the document does not exist or belongs to a different user, `scalar_one_or_none()` returns `None` and the existing HTTP 404 fires — no existence information is leaked.

Note: documents with `uploaded_by IS NULL` (orphaned by user deletion via `ondelete="SET NULL"`) also return 404. There is no legitimate owner for an orphaned document, and every creation path in `listing_service.py` always sets `uploaded_by` explicitly.

## Verification

**CONFIRMED:** true — `documents.py:62` (HEAD) queries by `ListingDocument.id` alone  
**Targeted:** CONFIDENT — sole hunk adds the ownership predicate  
**No new vulnerability:** CONFIDENT — purely restricts the query  
**Behaviour unchanged:** CONFIDENT (untested: true — no test exercises this endpoint)

**Adversarial challenge:** exploit closed. Pre-existing: `list_documents` had the same issue — addressed by F13. `GET /listings/{listing_id}/documents` has no ownership filter — set aside as a separate pre-existing finding.
