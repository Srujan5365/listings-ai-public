# F9 — require_approval ignores user_id — any authorized user can reuse any other user's approval

**Severity:** HIGH  
**CWE:** CWE-863  
**Files changed:** `backend/app/services/approval_gate.py`, `backend/tests/test_workflow.py`

## Finding

`require_approval` accepted a `user_id` parameter but the SQLAlchemy WHERE clause never included it. Any `Approval` record with the right `(listing_id, action_type, status='approved')` triple satisfied the check regardless of who the approval was granted to. A user in any tenant could bypass the approval requirement by reusing an approval issued to any other user for the same listing and action.

## Fix

One predicate added to the WHERE clause:

```python
Approval.requested_by == user_id,
```

All five production call sites in `integrations.py` already pass `current_user.id` as `user_id` — they are unaffected. The test `test_approval_gate_passes_with_approval` was passing `approver_id` instead of `requester_id` to `require_approval`, masking the bug. The test is corrected to use `requester_id`.

## Verification

**CONFIRMED:** true — `approval_gate.py` HEAD lines 17-24, no `user_id` predicate anywhere in the function body  
**Targeted:** CONFIDENT — one predicate addition + one test argument correction  
**No new vulnerability:** CONFIDENT — strictly narrows the matching set  
**Behaviour unchanged:** CONFIDENT (untested: false — 15 tests pass in `test_workflow.py` and `test_approval_gates.py`)

**Tests run:** `pytest tests/test_workflow.py tests/test_approval_gates.py` — 15 passed  
**Adversarial challenge:** no attack paths found. Pre-existing: approvals never marked consumed (same approval can be reused multiple times); gmail_send approval gate skipped when `msg.listing_id` is None — both set aside.
