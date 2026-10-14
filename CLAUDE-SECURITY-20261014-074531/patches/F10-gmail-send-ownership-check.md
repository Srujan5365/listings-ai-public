# F10 — gmail_send fetches Message by UUID with no ownership check (IDOR)

**Severity:** HIGH  
**CWE:** CWE-639  
**Files changed:** `backend/app/api/v1/integrations.py`

## Finding

The `gmail_send` handler at `integrations.py:319` looked up a `Message` by `Message.id == message_id` alone with no ownership predicate. Any authenticated user who knew a target message UUID could call `POST /integrations/gmail/send/{uuid}` to trigger dispatch of a message they did not own, using their own Gmail connection. Combined with F13 (list_documents IDOR), an attacker could enumerate message UUIDs and then send them.

## Fix

Adds `Message.owner_user_id == current_user.id` as a second WHERE predicate. If the message does not exist or belongs to a different user, `scalar_one_or_none()` returns `None` and the existing 404 fires — no existence information is leaked.

## Verification

**CONFIRMED:** true — `integrations.py:319` pre-change performs bare `Message.id` lookup  
**Targeted:** CONFIDENT — sole hunk adds the ownership predicate  
**No new vulnerability:** CONFIDENT — strictly restricts the query; `owner_user_id` is a non-nullable FK  
**Behaviour unchanged:** CONFIDENT (untested — env vars required to run tests)

**Adversarial challenge:** no attack paths found. All other Message lookups in the codebase (`inbox.py`) were already scoped by `owner_user_id`.
