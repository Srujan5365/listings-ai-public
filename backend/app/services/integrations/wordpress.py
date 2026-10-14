import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.listing import ExtractedField, Listing
from app.services.integrations import IntegrationBase

# CWB F-144 to F-161 WordPress ACF field mapping
_WP_META_FIELDS = {
    "F-145": "listing_status",
    "F-146": "listing_agent",
    "F-147": "mls_number",
    "F-148": "neighborhood",
    "F-149": "price",
    "F-150": "property_type",
    "F-151": "bedrooms",
    "F-152": "bathrooms",
    "F-153": "sqft",
    "F-154": "lot_size",
    "F-155": "parking",
    "F-156": "taxes",
    "F-158": "virtual_tour",
    "F-159": "featured_video",
}


class WordPressService(IntegrationBase):
    def __init__(self):
        s = get_settings()
        self.base = s.WORDPRESS_BASE_URL.rstrip("/")
        self.auth = (s.WORDPRESS_USERNAME, s.WORDPRESS_APP_PASSWORD)

    def _api(self, path: str) -> str:
        return f"{self.base}/wp-json/wp/v2{path}"

    async def _build_post_payload(self, listing: Listing, fields: dict) -> dict:
        meta = {}
        for field_id, wp_key in _WP_META_FIELDS.items():
            val = fields.get(field_id)
            if val is not None:
                meta[wp_key] = val

        # Override with promoted listing columns where available
        if listing.mls_number:
            meta["mls_number"] = listing.mls_number
        if listing.list_price:
            meta["price"] = str(listing.list_price)
        if listing.agent_name:
            meta["listing_agent"] = listing.agent_name

        return {
            "title": listing.address or f"Listing {listing.internal_ref}",
            "status": "draft",  # NEVER 'publish'
            "content": fields.get("F-160", ""),
            "meta": meta,
        }

    async def create_draft(self, listing_id: uuid.UUID, db: AsyncSession) -> dict:
        listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
        listing = listing_result.scalar_one_or_none()
        if listing is None:
            raise HTTPException(status_code=404, detail="Listing not found")

        fields_result = await db.execute(
            select(ExtractedField).where(ExtractedField.listing_id == listing_id)
        )
        fields = {f.field_id: f.override_value or f.value for f in fields_result.scalars().all()}

        payload = await self._build_post_payload(listing, fields)
        assert payload["status"] == "draft", "WordPress payload must always be draft"

        post_type = getattr(get_settings(), "WORDPRESS_POST_TYPE", "posts")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self._api(f"/{post_type}"),
                json=payload,
                auth=self.auth,
            )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: wordpress returned {resp.status_code}",
            )
        data = resp.json()
        return {
            "post_id": data.get("id"),
            "link": data.get("link"),
            "status": data.get("status"),
        }

    async def update_draft(self, post_id: int, listing_id: uuid.UUID, db: AsyncSession) -> dict:
        listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
        listing = listing_result.scalar_one_or_none()
        if listing is None:
            raise HTTPException(status_code=404, detail="Listing not found")

        fields_result = await db.execute(
            select(ExtractedField).where(ExtractedField.listing_id == listing_id)
        )
        fields = {f.field_id: f.override_value or f.value for f in fields_result.scalars().all()}

        payload = await self._build_post_payload(listing, fields)
        assert payload["status"] == "draft", "WordPress payload must always be draft"

        post_type = getattr(get_settings(), "WORDPRESS_POST_TYPE", "posts")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self._api(f"/{post_type}/{post_id}"),
                json=payload,
                auth=self.auth,
            )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Integration error: wordpress returned {resp.status_code}",
            )
        data = resp.json()
        return {
            "post_id": data.get("id"),
            "link": data.get("link"),
            "status": data.get("status"),
        }

    async def publish(self, post_id: int) -> None:
        # Publishing always requires a human action in WordPress admin.
        # This system creates drafts only.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Website publishing requires a human action in WordPress admin. "
                "This system creates drafts only."
            ),
        )

    async def is_connected(self) -> bool:
        s = get_settings()
        return bool(s.WORDPRESS_BASE_URL and s.WORDPRESS_USERNAME)

    async def health_check(self) -> dict:
        if not await self.is_connected():
            return {"provider": "wordpress", "connected": False}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(self._api("/"), auth=self.auth, timeout=5)
            connected = resp.status_code == 200
            return {"provider": "wordpress", "connected": connected}
        except Exception:
            return {"provider": "wordpress", "connected": False}
