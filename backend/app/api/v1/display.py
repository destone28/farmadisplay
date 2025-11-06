"""Display public API endpoints."""

from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pharmacy import Pharmacy
from app.models.shift import Shift
from app.schemas.display import (
    DisplayDataResponse,
    DisplayPharmacyInfo,
    DisplayShiftInfo,
    NearbyPharmacyInfo
)

router = APIRouter(prefix="/display", tags=["display"])


@router.get("/{pharmacy_id}", response_model=DisplayDataResponse)
async def get_display_data(
    pharmacy_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get display data for a pharmacy (PUBLIC - NO AUTH).

    Returns:
    - Pharmacy information (name, address, logo)
    - Current shifts (based on current date/time)
    - Nearby pharmacies within 5km radius (PostGIS query)
    - Active messages (future feature)

    Optimized for performance with efficient queries.
    Suitable for frequent polling from display devices.
    """
    # Get pharmacy
    pharmacy = db.query(Pharmacy).filter(
        Pharmacy.id == pharmacy_id,
        Pharmacy.is_active == True
    ).first()

    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found"
        )

    # Get current shifts (today and current time)
    now = datetime.now()
    today = now.date()
    current_time = now.time()

    current_shifts = db.query(Shift).filter(
        Shift.pharmacy_id == pharmacy_id,
        Shift.date == today,
        Shift.start_time <= current_time,
        Shift.end_time >= current_time
    ).all()

    # Convert to display shift info
    shift_list = [
        DisplayShiftInfo(
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            notes=shift.notes
        )
        for shift in current_shifts
    ]

    # Get nearby pharmacies using Haversine formula (5km radius)
    nearby_pharmacies = []

    if pharmacy.latitude is not None and pharmacy.longitude is not None:
        # Get all active pharmacies with coordinates
        from math import radians, sin, cos, sqrt, atan2

        all_pharmacies = db.query(Pharmacy).filter(
            Pharmacy.id != pharmacy_id,
            Pharmacy.is_active == True,
            Pharmacy.latitude != None,
            Pharmacy.longitude != None
        ).all()

        # Calculate distances using Haversine formula
        pharmacy_distances = []
        for other in all_pharmacies:
            # Haversine formula for distance calculation
            R = 6371000  # Earth radius in meters
            lat1, lon1 = radians(pharmacy.latitude), radians(pharmacy.longitude)
            lat2, lon2 = radians(other.latitude), radians(other.longitude)

            dlat = lat2 - lat1
            dlon = lon2 - lon1

            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c

            if distance <= 5000:  # Within 5km
                pharmacy_distances.append((other, distance))

        # Sort by distance and limit to 10
        pharmacy_distances.sort(key=lambda x: x[1])
        nearby_pharmacies = [
            NearbyPharmacyInfo(
                id=p.id,
                name=p.name,
                address=p.address,
                city=p.city,
                phone=p.phone,
                distance_meters=float(dist)
            )
            for p, dist in pharmacy_distances[:10]
        ]

    # Build response
    return DisplayDataResponse(
        pharmacy=DisplayPharmacyInfo(
            id=pharmacy.id,
            name=pharmacy.name,
            address=pharmacy.address,
            city=pharmacy.city,
            phone=pharmacy.phone,
            logo_url=pharmacy.logo_url
        ),
        current_shifts=shift_list,
        nearby_pharmacies=nearby_pharmacies,
        messages=[],  # Future feature
        updated_at=datetime.utcnow()
    )


@router.get("/{pharmacy_id}/shifts", response_model=list[DisplayShiftInfo])
async def get_display_shifts(
    pharmacy_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get upcoming shifts for display (PUBLIC - NO AUTH).

    Returns shifts for the next 7 days.
    Useful for showing upcoming pharmacy hours.
    """
    # Verify pharmacy exists and is active
    pharmacy = db.query(Pharmacy).filter(
        Pharmacy.id == pharmacy_id,
        Pharmacy.is_active == True
    ).first()

    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found"
        )

    # Get shifts for next 7 days
    from datetime import timedelta
    today = datetime.now().date()
    end_date = today + timedelta(days=7)

    shifts = db.query(Shift).filter(
        Shift.pharmacy_id == pharmacy_id,
        Shift.date >= today,
        Shift.date <= end_date
    ).order_by(Shift.date, Shift.start_time).all()

    return [
        DisplayShiftInfo(
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            notes=shift.notes
        )
        for shift in shifts
    ]
