import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.listing import ListingDocument
from app.schemas.listing import ListingDocumentOut

router = APIRouter(prefix="/documents", tags=["documents"])

_TAB_STATUS = {
    "pending": "pending",
    "received": "received",
    "processed": "processed",
    "missing": "missing",
}


@router.get("", response_model=dict)
async def list_documents(
    tab: str | None = None,
    listing_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = Query(default=25, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(ListingDocument)
    if tab and tab in _TAB_STATUS:
        q = q.where(ListingDocument.status == _TAB_STATUS[tab])
    if listing_id:
        q = q.where(ListingDocument.listing_id == listing_id)
    if search:
        q = q.where(ListingDocument.file_name.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(ListingDocument.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    items = result.scalars().all()

    return {
        "items": [ListingDocumentOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{document_id}", response_model=ListingDocumentOut)
async def get_document(
    document_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ListingDocument).where(ListingDocument.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc
