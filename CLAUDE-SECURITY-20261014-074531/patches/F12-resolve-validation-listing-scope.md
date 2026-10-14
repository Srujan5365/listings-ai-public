# F12 — IDOR: resolve_validation lookup not scoped to the route's listing_id

**Severity:** HIGH  
**CWE:** CWE-639  
**Files changed:** `backend/app/api/v1/listings.py`, `backend/app/services/listing_service.py`

## Finding

The route `PATCH /listings/{listing_id}/validations/{validation_id}` accepted both IDs in the URL path, but the route handler only forwarded `validation_id` to the service. The service queried `ValidationResult` by `validation_id` alone, so a caller with `resolve_validation_conflicts` permission could force-pass a validation result on any listing by supplying a mismatched `(listing_id, validation_id)` pair.

## Fix

Two changes:
1. `listing_service.resolve_validation` gains a `listing_id: uuid.UUID` parameter and the WHERE clause becomes `ValidationResult.id == validation_id, ValidationResult.listing_id == listing_id`
2. The route handler now passes `listing_id` (already available from the path parameter) as the new first argument

A `(validation_id, listing_id)` pair that doesn't match in the DB returns `None` → HTTP 404.

## Verification

**CONFIRMED:** true — `listing_service.py:253` (HEAD) queries by `validation_id` alone  
**Targeted:** CONFIDENT — both hunks implement exactly the recommendation  
**No new vulnerability:** CONFIDENT — purely restrictive; `listing_id` comes from the URL path parameter  
**Behaviour unchanged:** CONFIDENT (untested: false — `test_resolve_validation` passes)

**Tests run:** `pytest tests/test_workflow_stage3.py::test_resolve_validation` — 1 passed; full suite 82 passed / 8 pre-existing failures  
**Adversarial challenge:** no attack paths found. Pre-existing: GET `/listings/<X>/validations` leaks all validations for any listing_id to any authenticated user — set aside as unrelated.
