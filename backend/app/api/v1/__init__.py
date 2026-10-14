from fastapi import APIRouter

from app.api.v1.activity import router as activity_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.documents import router as documents_router
from app.api.v1.inbox import router as inbox_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.listings import router as listings_router
from app.api.v1.settings import router as settings_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(listings_router)
router.include_router(settings_router)
router.include_router(activity_router)
router.include_router(inbox_router)
router.include_router(documents_router)
router.include_router(dashboard_router)
router.include_router(integrations_router)
