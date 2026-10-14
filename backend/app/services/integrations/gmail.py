import base64
import email.mime.text
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.encryption import decrypt, encrypt
from app.models.user import OAuthToken
from app.services.integrations import IntegrationBase

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
]


def get_oauth_url(state: str) -> str:
    settings = get_settings()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GMAIL_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)


async def exchange_code(code: str) -> dict:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Integration error: google returned {resp.status_code}",
        )
    return resp.json()


async def save_token(
    db: AsyncSession, user_id: uuid.UUID, token_data: dict
) -> OAuthToken:
    result = await db.execute(
        select(OAuthToken).where(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == "gmail",
        )
    )
    token = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=token_data.get("expires_in", 3600))

    if token is None:
        token = OAuthToken(
            user_id=user_id,
            provider="gmail",
            access_token_enc=encrypt(token_data["access_token"]),
            refresh_token_enc=encrypt(token_data.get("refresh_token", "")),
            expires_at=expires_at,
            scopes=token_data.get("scope", "").split(),
        )
        db.add(token)
    else:
        token.access_token_enc = encrypt(token_data["access_token"])
        if token_data.get("refresh_token"):
            token.refresh_token_enc = encrypt(token_data["refresh_token"])
        token.expires_at = expires_at
        token.scopes = token_data.get("scope", "").split()
        token.updated_at = now

    await db.flush()
    await db.refresh(token)
    return token


class GmailService(IntegrationBase):
    def __init__(self, user_id: uuid.UUID, db: AsyncSession):
        self.user_id = user_id
        self.db = db

    async def _get_token(self) -> OAuthToken | None:
        result = await self.db.execute(
            select(OAuthToken).where(
                OAuthToken.user_id == self.user_id,
                OAuthToken.provider == "gmail",
            )
        )
        return result.scalar_one_or_none()

    async def _refresh_if_needed(self, token: OAuthToken) -> str:
        expires_at = token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at > datetime.now(timezone.utc) + timedelta(minutes=5):
            return decrypt(token.access_token_enc)

        settings = get_settings()
        refresh_token = decrypt(token.refresh_token_enc)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "refresh_token": refresh_token,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                },
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Gmail token refresh failed — please reconnect Gmail",
            )
        data = resp.json()
        token.access_token_enc = encrypt(data["access_token"])
        token.expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )
        await self.db.flush()
        return data["access_token"]

    async def get_access_token(self) -> str:
        token = await self._get_token()
        if token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Gmail not connected. Please complete OAuth flow.",
            )
        return await self._refresh_if_needed(token)

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        thread_id: str | None = None,
    ) -> dict:
        access_token = await self.get_access_token()
        msg = email.mime.text.MIMEText(body)
        msg["to"] = to
        msg["subject"] = subject
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        payload: dict = {"raw": raw}
        if thread_id:
            payload["threadId"] = thread_id

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{GMAIL_API_BASE}/messages/send",
                json=payload,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: gmail returned {resp.status_code}",
            )
        data = resp.json()
        return {"message_id": data.get("id"), "thread_id": data.get("threadId")}

    async def list_messages(self, query: str = "", max_results: int = 50) -> list[dict]:
        access_token = await self.get_access_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GMAIL_API_BASE}/messages",
                params={"q": query, "maxResults": max_results},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: gmail returned {resp.status_code}",
            )
        return resp.json().get("messages", [])

    async def get_message(self, message_id: str) -> dict:
        access_token = await self.get_access_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GMAIL_API_BASE}/messages/{message_id}",
                params={"format": "full"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: gmail returned {resp.status_code}",
            )
        data = resp.json()
        headers = {h["name"].lower(): h["value"] for h in data.get("payload", {}).get("headers", [])}
        parts = data.get("payload", {}).get("parts", [])
        body = ""
        for part in parts:
            if part.get("mimeType") == "text/plain":
                body_data = part.get("body", {}).get("data", "")
                body = base64.urlsafe_b64decode(body_data + "==").decode("utf-8", errors="replace")
                break
        received_ms = int(data.get("internalDate", 0))
        received_at = datetime.fromtimestamp(received_ms / 1000, tz=timezone.utc) if received_ms else None
        return {
            "id": data.get("id"),
            "thread_id": data.get("threadId"),
            "from": headers.get("from"),
            "to": headers.get("to"),
            "subject": headers.get("subject"),
            "body": body,
            "received_at": received_at.isoformat() if received_at else None,
        }

    async def is_connected(self) -> bool:
        token = await self._get_token()
        return token is not None

    async def health_check(self) -> dict:
        connected = await self.is_connected()
        return {"provider": "gmail", "connected": connected, "user_id": str(self.user_id)}
