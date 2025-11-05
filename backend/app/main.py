"""FastAPI application entry point."""

import time
import uuid
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis import Redis

from app.config import get_settings
from app.api.v1 import api_router

settings = get_settings()

app = FastAPI(
    title="FarmaDisplay API",
    description="API per la gestione turni farmacie e bacheche elettroniche",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware using Redis.
    Limit: 100 requests per minute per IP.
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"

    # Skip rate limiting for health checks
    if request.url.path.startswith("/health") or request.url.path == "/":
        return await call_next(request)

    try:
        redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

        # Rate limit key
        rate_limit_key = f"rate_limit:{client_ip}"

        # Get current request count
        current_requests = redis_client.get(rate_limit_key)

        if current_requests is None:
            # First request in this minute
            redis_client.setex(rate_limit_key, 60, 1)
        elif int(current_requests) >= 100:
            # Rate limit exceeded
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 100 requests per minute."
            )
        else:
            # Increment counter
            redis_client.incr(rate_limit_key)

    except HTTPException:
        raise
    except Exception as e:
        # If Redis is down, log but don't block requests
        print(f"Rate limiting error: {e}")

    response = await call_next(request)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with logging."""
    request_id = getattr(request.state, "request_id", "unknown")

    # Log the error (in production, use proper logging)
    print(f"[{request_id}] Unhandled exception: {type(exc).__name__}: {str(exc)}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "request_id": request_id
        }
    )


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FarmaDisplay API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print("FarmaDisplay API starting up...")
    print(f"Environment: {'Production' if not settings.DEBUG else 'Development'}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    print("FarmaDisplay API shutting down...")
