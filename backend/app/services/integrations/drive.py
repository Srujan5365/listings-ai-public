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
DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"


def get_oauth_url(state: str) -> str:
    settings = get_settings()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": DRIVE_SCOPE,
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
            OAuthToken.provider == "google_drive",
        )
    )
    token = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=token_data.get("expires_in", 3600))

    if token is None:
        token = OAuthToken(
            user_id=user_id,
            provider="google_drive",
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


class DriveService(IntegrationBase):
    def __init__(self, user_id: uuid.UUID, db: AsyncSession):
        self.user_id = user_id
        self.db = db

    async def _get_token(self) -> OAuthToken | None:
        result = await self.db.execute(
            select(OAuthToken).where(
                OAuthToken.user_id == self.user_id,
                OAuthToken.provider == "google_drive",
            )
        )
        return result.scalar_one_or_none()

    async def get_access_token(self) -> str:
        token = await self._get_token()
        if token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google Drive not connected. Please complete OAuth flow.",
            )
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
                detail="Google Drive token refresh failed — please reconnect",
            )
        data = resp.json()
        token.access_token_enc = encrypt(data["access_token"])
        token.expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )
        await self.db.flush()
        return data["access_token"]

    async def create_folder(self, name: str, parent_id: str | None = None) -> dict:
        access_token = await self.get_access_token()
        metadata: dict = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{DRIVE_API_BASE}/files",
                json=metadata,
                params={"fields": "id,name,webViewLink"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: google_drive returned {resp.status_code}",
            )
        return resp.json()

    async def move_file(
        self, file_id: str, new_parent_id: str, old_parent_id: str | None = None
    ) -> dict:
        access_token = await self.get_access_token()
        params: dict = {
            "addParents": new_parent_id,
            "fields": "id,name,parents",
        }
        if old_parent_id:
            params["removeParents"] = old_parent_id
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{DRIVE_API_BASE}/files/{file_id}",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: google_drive returned {resp.status_code}",
            )
        return resp.json()

    async def upload_file(
        self,
        name: str,
        content: bytes,
        mime_type: str,
        parent_id: str | None = None,
    ) -> dict:
        import json as _json
        access_token = await self.get_access_token()
        metadata: dict = {"name": name}
        if parent_id:
            metadata["parents"] = [parent_id]
        boundary = "boundary_listings_ai"
        body = (
            f"--{boundary}\r\n"
            f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{_json.dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode() + content + f"\r\n--{boundary}--".encode()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{DRIVE_UPLOAD_BASE}/files",
                params={"uploadType": "multipart", "fields": "id,name,webViewLink"},
                content=body,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
            )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: google_drive returned {resp.status_code}",
            )
        return resp.json()

    async def list_files(
        self, folder_id: str | None = None, query: str = ""
    ) -> list[dict]:
        access_token = await self.get_access_token()
        q_parts = []
        if folder_id:
            q_parts.append(f"'{folder_id}' in parents")
        if query:
            q_parts.append(query)
        params: dict = {
            "fields": "files(id,name,mimeType,webViewLink,modifiedTime)",
            "q": " and ".join(q_parts) if q_parts else "",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{DRIVE_API_BASE}/files",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: google_drive returned {resp.status_code}",
            )
        return resp.json().get("files", [])

    async def organize_listing(self, listing_id: uuid.UUID, listing_ref: str) -> dict:
        settings = get_settings()
        root_parent = settings.GOOGLE_DRIVE_ROOT_FOLDER_ID if hasattr(settings, "GOOGLE_DRIVE_ROOT_FOLDER_ID") else None
        root = await self.create_folder(listing_ref, parent_id=root_parent)
        root_id = root["id"]
        source_docs = await self.create_folder("source_docs", parent_id=root_id)
        processed = await self.create_folder("processed", parent_id=root_id)
        evidence = await self.create_folder("evidence", parent_id=root_id)
        return {
            "root_folder_id": root_id,
            "source_docs_id": source_docs["id"],
            "processed_id": processed["id"],
            "evidence_id": evidence["id"],
            "web_links": {
                "root": root.get("webViewLink"),
                "source_docs": source_docs.get("webViewLink"),
                "processed": processed.get("webViewLink"),
                "evidence": evidence.get("webViewLink"),
            },
        }

    async def is_connected(self) -> bool:
        token = await self._get_token()
        return token is not None

    async def health_check(self) -> dict:
        connected = await self.is_connected()
        return {
            "provider": "google_drive",
            "connected": connected,
            "user_id": str(self.user_id),
        }
