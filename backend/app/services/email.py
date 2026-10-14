import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.FROM_EMAIL:
        logger.warning(
            "SMTP not configured — skipping password reset email to %s. "
            "Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL, APP_URL in .env.",
            to_email,
        )
        return

    reset_url = f"{settings.APP_URL}/reset-password?token={reset_token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Listings AI password"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email

    text_body = f"Reset your password by visiting: {reset_url}\n\nThis link expires in 15 minutes."
    html_body = f"""
    <p>You requested a password reset for your Listings AI account.</p>
    <p><a href="{reset_url}">Click here to reset your password</a></p>
    <p>This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=True,
    )
    logger.info("Password reset email sent to %s", to_email)
