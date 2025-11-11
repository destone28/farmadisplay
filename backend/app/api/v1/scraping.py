"""API endpoints for pharmacy scraping."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date, time as dt_time, datetime
from pydantic import BaseModel

from app.services.scraping_service import scraping_service, PharmacyShiftInfo

router = APIRouter(prefix="/scraping", tags=["scraping"])


class ScrapeRequest(BaseModel):
    """Request per ricerca farmacie."""
    cap: Optional[str] = None
    city: Optional[str] = None
    search_date: Optional[str] = None  # Format: YYYY-MM-DD
    search_time: Optional[str] = None  # Format: HH:MM


class ScrapeResponse(BaseModel):
    """Response con farmacie trovate."""
    pharmacies: List[PharmacyShiftInfo]
    total: int
    search_params: dict


@router.post("/search", response_model=ScrapeResponse)
async def search_pharmacies(request: ScrapeRequest):
    """
    Cerca farmacie di turno o aperte tramite scraping.

    - **cap**: CAP per la ricerca (alternativa a city)
    - **city**: Città per la ricerca (alternativa a cap)
    - **search_date**: Data ricerca (default: oggi) formato YYYY-MM-DD
    - **search_time**: Ora ricerca (default: ora corrente) formato HH:MM
    """
    if not request.cap and not request.city:
        raise HTTPException(
            status_code=400,
            detail="Deve essere specificato almeno CAP o città"
        )

    # Parse date and time
    search_date = None
    search_time = None

    try:
        if request.search_date:
            search_date = datetime.strptime(request.search_date, "%Y-%m-%d").date()
        if request.search_time:
            search_time = datetime.strptime(request.search_time, "%H:%M").time()
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Formato data/ora non valido: {str(e)}"
        )

    try:
        pharmacies = await scraping_service.search_pharmacies(
            cap=request.cap,
            city=request.city,
            search_date=search_date,
            search_time=search_time
        )

        return ScrapeResponse(
            pharmacies=pharmacies,
            total=len(pharmacies),
            search_params={
                "cap": request.cap,
                "city": request.city,
                "date": search_date.isoformat() if search_date else datetime.now().date().isoformat(),
                "time": search_time.isoformat() if search_time else datetime.now().time().strftime("%H:%M")
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante lo scraping: {str(e)}"
        )


@router.get("/test", response_model=ScrapeResponse)
async def test_scraping(
    cap: str = Query(..., description="CAP per test"),
    date_str: Optional[str] = Query(None, description="Data (YYYY-MM-DD)"),
    time_str: Optional[str] = Query(None, description="Ora (HH:MM)")
):
    """
    Endpoint di test per scraping rapido.

    Esempio: /api/v1/scraping/test?cap=21049&date_str=2025-11-11&time_str=22:00
    """
    request = ScrapeRequest(
        cap=cap,
        search_date=date_str,
        search_time=time_str
    )

    return await search_pharmacies(request)
