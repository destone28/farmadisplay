"""FastAPI application entry point."""

import time
import uuid
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from redis import Redis
from pathlib import Path

from app.config import get_settings
from app.api.v1 import api_router

settings = get_settings()

app = FastAPI(
    title="TurnoTec API",
    description="""
    API completa per gestione turni farmacie con display elettronici.

    ## 🎯 Features

    * 🔐 **Autenticazione JWT** - Sistema sicuro con role-based access control
    * 💊 **Gestione Farmacie** - CRUD completo con geolocalizzazione PostGIS
    * 📅 **Gestione Turni** - Supporto turni ricorrenti con RRULE (RFC 5545)
    * 📱 **Gestione Dispositivi** - Attivazione e monitoraggio Raspberry Pi
    * 🗺️ **Display Pubblico** - API ottimizzata con farmacie nelle vicinanze (5km radius)

    ## 🔐 Authentication

    Tutti gli endpoint (eccetto `/display` e `/health`) richiedono JWT token:

    ```
    Authorization: Bearer <your-jwt-token>
    ```

    Ottieni il token tramite:
    1. Registrazione: `POST /api/v1/auth/register`
    2. Login: `POST /api/v1/auth/login`

    ## 👥 Roles

    - **USER**: Gestisce le proprie farmacie, turni e dispositivi
    - **ADMIN**: Accesso completo a tutte le risorse, può registrare nuovi dispositivi

    ## 📊 Pagination

    Gli endpoint di listing supportano pagination:

    ```
    GET /api/v1/pharmacies?skip=0&limit=20
    ```

    Response format:
    ```json
    {
        "items": [...],
        "total": 100,
        "skip": 0,
        "limit": 20,
        "has_more": true
    }
    ```

    ## 🌍 Geolocation

    Le farmacie supportano geolocalizzazione PostGIS:

    ```json
    {
        "name": "Farmacia Test",
        "location": {
            "longitude": 9.1900,
            "latitude": 45.4642
        }
    }
    ```

    ## 🔄 Recurring Shifts

    I turni ricorrenti usano RRULE (RFC 5545):

    ```json
    {
        "is_recurring": true,
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
    }
    ```

    Esempi RRULE:
    - Giornaliero: `FREQ=DAILY`
    - Settimanale (Lun/Mer/Ven): `FREQ=WEEKLY;BYDAY=MO,WE,FR`
    - Mensile (primo lunedì): `FREQ=MONTHLY;BYDAY=1MO`

    ## 🚀 Quick Start

    1. Registra un utente admin
    2. Crea una farmacia
    3. Registra un dispositivo (admin only)
    4. Attiva il dispositivo sulla farmacia
    5. Crea turni per la farmacia
    6. Accedi ai dati tramite display API

    ## 📞 Support

    - Email: admin@turnotec.com
    - Docs: https://docs.turnotec.com
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    contact={
        "name": "TurnoTec Team",
        "email": "admin@turnotec.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
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

    # Ensure UTF-8 encoding for all responses to handle special characters (è, é, à, ì, ù, ò, etc.)
    if "content-type" in response.headers:
        content_type = response.headers["content-type"]
        if "application/json" in content_type and "charset" not in content_type:
            response.headers["content-type"] = "application/json; charset=utf-8"

    return response


# Rate limiting middleware (optional - requires Redis)
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware using Redis.
    Limit: 100 requests per minute per IP.
    If Redis is unavailable, requests are allowed through without limiting.
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"

    # Skip rate limiting for health checks and root
    if request.url.path.startswith("/health") or request.url.path == "/":
        return await call_next(request)

    # Try to apply rate limiting, but don't block if Redis is down
    try:
        redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)

        # Test connection
        redis_client.ping()

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

        redis_client.close()

    except HTTPException:
        # Re-raise rate limit exceeded errors
        raise
    except Exception as e:
        # If Redis is down or connection fails, allow request through
        # Only log once per startup to avoid spam
        if not hasattr(rate_limit_middleware, '_redis_error_logged'):
            print(f"Rate limiting disabled: Redis not available ({e})")
            rate_limit_middleware._redis_error_logged = True

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

# Mount static files for uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "TurnoTec API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print("TurnoTec API starting up...")
    print(f"Environment: {'Production' if not settings.DEBUG else 'Development'}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    print("TurnoTec API shutting down...")
