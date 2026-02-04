from fastapi import APIRouter
from app.api.v1.endpoints import governance, history, analytics

api_router = APIRouter()
api_router.include_router(governance.router, prefix="/governance", tags=["governance"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
