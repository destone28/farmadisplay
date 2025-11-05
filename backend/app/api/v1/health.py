"""Health check endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from redis import Redis

from app.database import get_db
from app.config import get_settings

router = APIRouter(prefix="/health", tags=["health"])
settings = get_settings()


@router.get("")
async def health_check() -> dict[str, str]:
    """
    Basic health check endpoint.

    Returns:
        Health status
    """
    return {"status": "healthy"}


@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    """
    Detailed health check with database and Redis status.

    Args:
        db: Database session

    Returns:
        Detailed health status for all services
    """
    status = {
        "api": "healthy",
        "database": "unknown",
        "redis": "unknown"
    }

    # Check database
    try:
        db.execute("SELECT 1")
        status["database"] = "healthy"
    except Exception as e:
        status["database"] = f"unhealthy: {str(e)}"

    # Check Redis
    try:
        redis_client = Redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        status["redis"] = "healthy"
    except Exception as e:
        status["redis"] = f"unhealthy: {str(e)}"

    return status
