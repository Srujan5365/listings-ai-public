import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.listing import ExtractedField, Listing
from app.services.integrations import IntegrationBase

BASE_URL = "https://app.asana.com/api/1.0"

# CWB Asana field mapping (F-131 to F-138)
_ASANA_FIELD_MAP = {
    "F-131": "listing_type",
    "F-132": "google_folder_link",
    "F-133": "fub_link",
    "F-134": "list_price",
    "F-135": "expiry_date",
    "F-136": "photo_date",
    "F-137": "listing_coordinator",
    "F-138": "original_price",
}

# Asana task custom field name → extracted field ID
_TASK_FIELD_KEY = "asana_task_gid"


class AsanaService(IntegrationBase):
    def __init__(self):
        self.pat = get_settings().ASANA_PAT
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                method,
                f"{BASE_URL}{path}",
                headers=self.headers,
                **kwargs,
            )
        if not (200 <= resp.status_code < 300):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: asana returned {resp.status_code}",
            )
        return resp.json()

    async def create_task(self, project_gid: str, task_data: dict) -> dict:
        payload = {
            "data": {
                "name": task_data.get("name", "New Listing"),
                "projects": [project_gid],
                "notes": task_data.get("notes", ""),
                "custom_fields": task_data.get("custom_fields", {}),
            }
        }
        result = await self._request("POST", "/tasks", json=payload)
        data = result.get("data", result)
        return {
            "gid": data.get("gid"),
            "name": data.get("name"),
            "permalink_url": data.get("permalink_url"),
        }

    async def update_task(self, task_gid: str, task_data: dict) -> dict:
        payload = {"data": task_data}
        result = await self._request("PUT", f"/tasks/{task_gid}", json=payload)
        data = result.get("data", result)
        return {
            "gid": data.get("gid"),
            "name": data.get("name"),
            "permalink_url": data.get("permalink_url"),
        }

    async def add_comment(self, task_gid: str, text: str) -> dict:
        payload = {"data": {"text": text}}
        result = await self._request("POST", f"/tasks/{task_gid}/stories", json=payload)
        return result.get("data", result)

    async def get_task(self, task_gid: str) -> dict:
        result = await self._request("GET", f"/tasks/{task_gid}")
        return result.get("data", result)

    async def sync_listing(self, listing_id: uuid.UUID, db: AsyncSession) -> dict:
        settings = get_settings()
        project_gid = getattr(settings, "ASANA_PROJECT_GID", "")

        listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
        listing = listing_result.scalar_one_or_none()
        if listing is None:
            raise HTTPException(status_code=404, detail="Listing not found")

        fields_result = await db.execute(
            select(ExtractedField).where(ExtractedField.listing_id == listing_id)
        )
        fields = {f.field_id: f.override_value or f.value for f in fields_result.scalars().all()}

        task_name = f"{listing.internal_ref or str(listing_id)} — {listing.address or 'Unknown Address'}"
        notes_parts = [
            f"Listing Type: {listing.listing_type or fields.get('F-131', 'N/A')}",
            f"List Price: {listing.list_price or fields.get('F-134', 'N/A')}",
            f"Live Date: {listing.live_date or 'TBD'}",
            f"Agent: {listing.agent_name or 'N/A'}",
            f"Expiry Date: {fields.get('F-135', 'N/A')}",
            f"Photo Date: {fields.get('F-136', 'N/A')}",
            f"Original Price: {fields.get('F-138', 'N/A')}",
        ]

        existing_gid = fields.get(_TASK_FIELD_KEY)
        task_data = {
            "name": task_name,
            "notes": "\n".join(notes_parts),
            "custom_fields": {},
        }

        synced_fields = [k for k in _ASANA_FIELD_MAP if fields.get(k)]

        if existing_gid:
            result = await self.update_task(existing_gid, task_data)
            task_gid = result["gid"]
        else:
            result = await self.create_task(project_gid, task_data)
            task_gid = result["gid"]

        return {
            "task_gid": task_gid,
            "permalink_url": result.get("permalink_url"),
            "synced_fields": synced_fields,
        }

    async def is_connected(self) -> bool:
        return bool(get_settings().ASANA_PAT)

    async def health_check(self) -> dict:
        if not self.pat:
            return {"provider": "asana", "connected": False}
        try:
            result = await self._request("GET", "/users/me")
            data = result.get("data", {})
            return {
                "provider": "asana",
                "connected": True,
                "account_name": data.get("name"),
            }
        except HTTPException:
            return {"provider": "asana", "connected": False}
