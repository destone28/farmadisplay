"""API v1 routes."""

from fastapi import APIRouter

from app.api.v1 import auth, health, pharmacies, shifts, devices, display

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(pharmacies.router)
api_router.include_router(shifts.router)
api_router.include_router(devices.router)
api_router.include_router(display.router)

__all__ = ["api_router"]
