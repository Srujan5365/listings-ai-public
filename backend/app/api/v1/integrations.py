import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.approval import Approval
from app.models.message import Message
from app.models.user import OAuthToken, User
from app.models.write_job import WriteJob
from app.services import audit as audit_svc
from app.services.approval_gate import require_approval
from app.services.integrations.asana import AsanaService
from app.services.integrations.drive import DriveService
from app.services.integrations.drive import exchange_code as drive_exchange_code
from app.services.integrations.drive import get_oauth_url as drive_oauth_url
from app.services.integrations.drive import save_token as drive_save_token
from app.services.integrations.fub import FUBService
from app.services.integrations.gmail import GmailService
from app.services.integrations.gmail import exchange_code as gmail_exchange_code
from app.services.integrations.gmail import get_oauth_url as gmail_oauth_url
from app.services.integrations.gmail import save_token as gmail_save_token
from app.services.integrations.wordpress import WordPressService

router = APIRouter(prefix="/integrations", tags=["integrations"])

_auth = Depends(get_current_user)


def _now():
    return datetime.now(timezone.utc)


# ── OAuth ──────────────────────────────────────────────────────────────────────

@router.get("/google/auth")
async def google_auth(
    provider: str = Query(..., description="gmail or google_drive"),
    current_user: User = _auth,
):
    if provider not in ("gmail", "google_drive"):
        raise HTTPException(status_code=400, detail="provider must be 'gmail' or 'google_drive'")
    state = f"{current_user.id}:{provider}"
    if provider == "gmail":
        auth_url = gmail_oauth_url(state)
    else:
        auth_url = drive_oauth_url(state)
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id_str, provider = state.split(":", 1)
        user_id = uuid.UUID(user_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    if provider == "gmail":
        token_data = await gmail_exchange_code(code)
        await gmail_save_token(db, user_id, token_data)
    elif provider == "google_drive":
        token_data = await drive_exchange_code(code)
        await drive_save_token(db, user_id, token_data)
    else:
        raise HTTPException(status_code=400, detail="Unknown provider in state")

    await db.commit()
    return {"status": "connected", "provider": provider}


# ── Integration write endpoints (all gated) ───────────────────────────────────

@router.post("/fub/sync/{listing_id}")
async def fub_sync(
    listing_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_listing_fields")),
    db: AsyncSession = Depends(get_db),
):
    approval = await require_approval(db, listing_id, "fub_write", current_user.id)
    try:
        fub = FUBService()
        result = await fub.sync_listing(listing_id, db)
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="fub",
            operation="sync",
            status="success",
            payload={"listing_id": str(listing_id)},
            result=result,
            completed_at=_now(),
        )
        db.add(job)
        await db.flush()
        await audit_svc.log_action(
            db,
            user_id=current_user.id,
            listing_id=listing_id,
            action="integration.fub.synced",
            entity_type="write_job",
            entity_id=str(job.id),
            old_value=None,
            new_value=result,
        )
        await db.commit()
        return {"status": "synced", "fub_data": result}
    except HTTPException:
        raise
    except Exception as exc:
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="fub",
            operation="sync",
            status="failed",
            payload={"listing_id": str(listing_id)},
            error_message=str(exc),
            completed_at=_now(),
        )
        db.add(job)
        await db.commit()
        raise HTTPException(status_code=502, detail=f"FUB sync failed: {exc}")


@router.post("/asana/sync/{listing_id}")
async def asana_sync(
    listing_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_listing_fields")),
    db: AsyncSession = Depends(get_db),
):
    approval = await require_approval(db, listing_id, "asana_write", current_user.id)
    try:
        asana = AsanaService()
        result = await asana.sync_listing(listing_id, db)
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="asana",
            operation="sync",
            status="success",
            payload={"listing_id": str(listing_id)},
            result=result,
            completed_at=_now(),
        )
        db.add(job)
        await db.flush()
        await audit_svc.log_action(
            db,
            user_id=current_user.id,
            listing_id=listing_id,
            action="integration.asana.synced",
            entity_type="write_job",
            entity_id=str(job.id),
            old_value=None,
            new_value=result,
        )
        await db.commit()
        return {"status": "synced", "asana_data": result}
    except HTTPException:
        raise
    except Exception as exc:
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="asana",
            operation="sync",
            status="failed",
            error_message=str(exc),
            completed_at=_now(),
        )
        db.add(job)
        await db.commit()
        raise HTTPException(status_code=502, detail=f"Asana sync failed: {exc}")


@router.post("/drive/organize/{listing_id}")
async def drive_organize(
    listing_id: uuid.UUID,
    current_user: User = Depends(require_permission("manage_listing_fields")),
    db: AsyncSession = Depends(get_db),
):
    approval = await require_approval(db, listing_id, "drive_organize", current_user.id)
    from sqlalchemy import select as _select
    from app.models.listing import Listing
    listing_result = await db.execute(_select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    try:
        drive = DriveService(current_user.id, db)
        listing_ref = listing.internal_ref or str(listing_id)
        result = await drive.organize_listing(listing_id, listing_ref)
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="google_drive",
            operation="organize",
            status="success",
            payload={"listing_id": str(listing_id), "listing_ref": listing_ref},
            result=result,
            completed_at=_now(),
        )
        db.add(job)
        await db.flush()
        await audit_svc.log_action(
            db,
            user_id=current_user.id,
            listing_id=listing_id,
            action="integration.drive.organized",
            entity_type="write_job",
            entity_id=str(job.id),
            old_value=None,
            new_value=result,
        )
        await db.commit()
        return {"status": "organized", "drive_data": result}
    except HTTPException:
        raise
    except Exception as exc:
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="google_drive",
            operation="organize",
            status="failed",
            error_message=str(exc),
            completed_at=_now(),
        )
        db.add(job)
        await db.commit()
        raise HTTPException(status_code=502, detail=f"Drive organize failed: {exc}")


@router.post("/wordpress/draft/{listing_id}")
async def wordpress_draft(
    listing_id: uuid.UUID,
    current_user: User = Depends(require_permission("publish_website")),
    db: AsyncSession = Depends(get_db),
):
    approval = await require_approval(db, listing_id, "wordpress_draft", current_user.id)

    # Check if a successful WP write job already exists (update vs create)
    existing_job_result = await db.execute(
        select(WriteJob).where(
            WriteJob.listing_id == listing_id,
            WriteJob.target == "wordpress",
            WriteJob.status == "success",
        )
    )
    existing_job = existing_job_result.scalar_one_or_none()

    try:
        wp = WordPressService()
        if existing_job and existing_job.result and existing_job.result.get("post_id"):
            result = await wp.update_draft(existing_job.result["post_id"], listing_id, db)
            operation = "update_draft"
        else:
            result = await wp.create_draft(listing_id, db)
            operation = "create_draft"

        assert result.get("status") == "draft", "WordPress response must be draft status"

        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="wordpress",
            operation=operation,
            status="success",
            payload={"listing_id": str(listing_id)},
            result=result,
            completed_at=_now(),
        )
        db.add(job)
        await db.flush()
        await audit_svc.log_action(
            db,
            user_id=current_user.id,
            listing_id=listing_id,
            action="integration.wordpress.draft_created",
            entity_type="write_job",
            entity_id=str(job.id),
            old_value=None,
            new_value=result,
        )
        await db.commit()
        return {"status": "draft_created", "wordpress_data": result}
    except HTTPException:
        raise
    except Exception as exc:
        job = WriteJob(
            listing_id=listing_id,
            approval_id=approval.id,
            target="wordpress",
            operation="create_draft",
            status="failed",
            error_message=str(exc),
            completed_at=_now(),
        )
        db.add(job)
        await db.commit()
        raise HTTPException(status_code=502, detail=f"WordPress draft failed: {exc}")


@router.post("/gmail/send/{message_id}")
async def gmail_send(
    message_id: uuid.UUID,
    current_user: User = _auth,
    db: AsyncSession = Depends(get_db),
):
    msg_result = await db.execute(select(Message).where(Message.id == message_id))
    msg = msg_result.scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=404, detail="Message not found")

    if msg.listing_id:
        await require_approval(db, msg.listing_id, "email_send", current_user.id)

    try:
        gmail = GmailService(current_user.id, db)
        to_emails = msg.to_emails or []
        to = to_emails[0] if to_emails else ""
        result = await gmail.send_email(
            to=to,
            subject=msg.subject or "",
            body=msg.body or "",
            thread_id=msg.gmail_thread_id,
        )
        msg.sent_at = _now()
        msg.gmail_message_id = result.get("message_id")
        if result.get("thread_id"):
            msg.gmail_thread_id = result["thread_id"]
        await db.flush()
        if msg.listing_id:
            await audit_svc.log_action(
                db,
                user_id=current_user.id,
                listing_id=msg.listing_id,
                action="integration.gmail.sent",
                entity_type="message",
                entity_id=str(message_id),
                old_value=None,
                new_value={"to": to, "subject": msg.subject},
            )
        await db.commit()
        return {"status": "sent", "message_id": result.get("message_id")}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gmail send failed: {exc}")


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
async def integrations_health(
    current_user: User = Depends(require_permission("manage_configuration")),
    db: AsyncSession = Depends(get_db),
):
    gmail = GmailService(current_user.id, db)
    drive = DriveService(current_user.id, db)
    fub = FUBService()
    asana = AsanaService()
    wp = WordPressService()

    results = []
    for svc in (gmail, drive, fub, asana, wp):
        try:
            results.append(await svc.health_check())
        except Exception as exc:
            results.append({"provider": str(type(svc).__name__), "connected": False, "error": str(exc)})

    return {"integrations": results}
