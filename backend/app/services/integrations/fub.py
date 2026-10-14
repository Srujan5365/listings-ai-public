import asyncio
import base64
import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.listing import ExtractedField, Listing
from app.services.integrations import IntegrationBase

BASE_URL = "https://api.followupboss.com/v1"

# CWB FUB field mapping (field_id → FUB custom field name)
_FIELD_MAP = {
    "F-005": "name",          # Main Client Name
    "F-007": "phone",         # Main Client Phone
    "F-008": "email",         # Main Client Email
    "F-139": "customPhotographyDate",
    "F-140": "customStagingDate",
    "F-141": "customPropertyForSale",
    "F-142": "customPropertyType",
}


class FUBService(IntegrationBase):
    def __init__(self):
        self.api_key = get_settings().FUB_API_KEY
        encoded = base64.b64encode(f"{self.api_key}:".encode()).decode()
        self.headers = {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                method,
                f"{BASE_URL}{path}",
                headers=self.headers,
                **kwargs,
            )
        if resp.status_code == 429:
            await asyncio.sleep(1)
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
                detail=f"Integration error: fub returned {resp.status_code}",
            )
        return resp.json()

    async def find_or_create_person(
        self, email: str, name: str, phone: str | None = None
    ) -> dict:
        data = await self._request("GET", f"/people", params={"email": email})
        people = data.get("people", [])
        if people:
            return {"id": people[0]["id"], "name": people[0].get("name"), "email": email}
        payload: dict = {"name": name, "emails": [{"value": email}]}
        if phone:
            payload["phones"] = [{"value": phone}]
        created = await self._request("POST", "/people", json=payload)
        person = created.get("person", created)
        return {"id": person["id"], "name": person.get("name"), "email": email}

    async def update_person(self, person_id: int, data: dict) -> dict:
        result = await self._request("PUT", f"/people/{person_id}", json=data)
        return result.get("person", result)

    async def create_deal(self, person_id: int, listing_data: dict) -> dict:
        payload = {
            "personId": person_id,
            "name": listing_data.get("address", "New Listing"),
            "price": listing_data.get("list_price"),
            "customPhotographyDate": listing_data.get("customPhotographyDate"),
            "customStagingDate": listing_data.get("customStagingDate"),
            "customPropertyForSale": listing_data.get("customPropertyForSale"),
            "customPropertyType": listing_data.get("customPropertyType"),
        }
        result = await self._request("POST", "/deals", json={k: v for k, v in payload.items() if v is not None})
        return result.get("deal", result)

    async def update_deal(self, deal_id: int, listing_data: dict) -> dict:
        result = await self._request("PUT", f"/deals/{deal_id}", json=listing_data)
        return result.get("deal", result)

    async def add_audit_note(self, person_id: int, note: str) -> dict:
        result = await self._request("POST", "/notes", json={"personId": person_id, "body": note})
        return result.get("note", result)

    async def sync_listing(self, listing_id: uuid.UUID, db: AsyncSession) -> dict:
        listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
        listing = listing_result.scalar_one_or_none()
        if listing is None:
            raise HTTPException(status_code=404, detail="Listing not found")

        fields_result = await db.execute(
            select(ExtractedField).where(ExtractedField.listing_id == listing_id)
        )
        fields = {f.field_id: f.override_value or f.value for f in fields_result.scalars().all()}

        client_email = fields.get("F-008") or listing.agent_email or ""
        client_name = fields.get("F-005") or listing.agent_name or "Unknown"
        client_phone = fields.get("F-007")

        person = await self.find_or_create_person(client_email, client_name, client_phone)
        person_id = person["id"]

        deal_data = {
            "address": listing.address or "",
            "list_price": float(listing.list_price) if listing.list_price else None,
            "customPhotographyDate": fields.get("F-139"),
            "customStagingDate": fields.get("F-140"),
            "customPropertyForSale": fields.get("F-141"),
            "customPropertyType": fields.get("F-142"),
        }
        deal = await self.create_deal(person_id, deal_data)

        audit_note = f"Listings AI sync: {listing.internal_ref or str(listing_id)} — {listing.address}"
        await self.add_audit_note(person_id, audit_note)

        synced = [k for k, v in deal_data.items() if v is not None]
        return {
            "person_id": person_id,
            "deal_id": deal.get("id"),
            "synced_fields": synced,
        }

    async def is_connected(self) -> bool:
        return bool(get_settings().FUB_API_KEY)

    async def health_check(self) -> dict:
        if not self.api_key:
            return {"provider": "fub", "connected": False}
        try:
            data = await self._request("GET", "/me")
            return {
                "provider": "fub",
                "connected": True,
                "account_name": data.get("account", {}).get("name"),
            }
        except HTTPException:
            return {"provider": "fub", "connected": False}
