"""API v1 routes."""

from fastapi import APIRouter

from app.api.v1 import auth, health, pharmacies, shifts, devices, display, display_config

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(pharmacies.router)
api_router.include_router(shifts.router)
api_router.include_router(devices.router)
api_router.include_router(display.router)
api_router.include_router(display_config.router, prefix="/display-config", tags=["display-config"])

__all__ = ["api_router"]
