"""Shifts API endpoints."""

from datetime import date
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shift import Shift
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftResponse
from app.dependencies import CurrentUser
from app.api.v1.pharmacies import require_pharmacy_access

router = APIRouter(prefix="/shifts", tags=["shifts"])


@router.get("/", response_model=List[ShiftResponse])
async def list_shifts(
    pharmacy_id: UUID = Query(..., description="Pharmacy UUID"),
    start_date: date = Query(..., description="Start date (ISO 8601)"),
    end_date: date = Query(..., description="End date (ISO 8601)"),
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    List shifts for a pharmacy within a date range.

    RBAC:
    - Users can only access shifts for their own pharmacies
    - Admins can access all shifts

    Filters:
    - pharmacy_id: Pharmacy UUID (required)
    - start_date: Start date in ISO 8601 format (required)
    - end_date: End date in ISO 8601 format (required)
    """
    # Verify pharmacy access
    await require_pharmacy_access(pharmacy_id, current_user, db)

    # Validate date range
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be greater than or equal to start_date"
        )

    # Query shifts
    shifts = db.query(Shift).filter(
        Shift.pharmacy_id == pharmacy_id,
        Shift.date >= start_date,
        Shift.date <= end_date
    ).order_by(Shift.date, Shift.start_time).all()

    return shifts


@router.post("/", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(
    shift_in: ShiftCreate,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Create a new shift.

    Validations:
    - end_time must be after start_time
    - If is_recurring=True, recurrence_rule is required (RRULE RFC 5545 format)
    - Timezone: Europe/Rome

    RRULE Examples:
    - Daily: FREQ=DAILY
    - Weekly on Mon/Wed/Fri: FREQ=WEEKLY;BYDAY=MO,WE,FR
    - Monthly on first Monday: FREQ=MONTHLY;BYDAY=1MO
    """
    # Verify pharmacy access
    await require_pharmacy_access(shift_in.pharmacy_id, current_user, db)

    # Validate time range
    if shift_in.end_time <= shift_in.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time"
        )

    # Validate RRULE if recurring
    if shift_in.is_recurring:
        if not shift_in.recurrence_rule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="recurrence_rule required when is_recurring=True"
            )

        # Validate RRULE format
        try:
            from dateutil.rrule import rrulestr
            # Test parse the RRULE
            rrulestr(
                f"DTSTART:{shift_in.date.strftime('%Y%m%d')}\nRRULE:{shift_in.recurrence_rule}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid RRULE format: {str(e)}"
            )

    # Create shift
    shift = Shift(**shift_in.dict())
    db.add(shift)
    db.commit()
    db.refresh(shift)

    return shift


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: UUID,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Get shift details.

    RBAC:
    - Users can only access shifts for their own pharmacies
    - Admins can access all shifts
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )

    # Verify pharmacy access
    await require_pharmacy_access(shift.pharmacy_id, current_user, db)

    return shift


@router.put("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: UUID,
    shift_in: ShiftUpdate,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Update shift information.

    Validations:
    - end_time must be after start_time
    - RRULE format validation if changed

    RBAC:
    - Only owner or admin can update
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )

    # Verify pharmacy access
    await require_pharmacy_access(shift.pharmacy_id, current_user, db)

    # Validate time range if times are being updated
    new_start = shift_in.start_time if shift_in.start_time is not None else shift.start_time
    new_end = shift_in.end_time if shift_in.end_time is not None else shift.end_time

    if new_end <= new_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time"
        )

    # Validate RRULE if changed
    if shift_in.recurrence_rule is not None:
        try:
            from dateutil.rrule import rrulestr
            shift_date = shift_in.date if shift_in.date is not None else shift.date
            rrulestr(
                f"DTSTART:{shift_date.strftime('%Y%m%d')}\nRRULE:{shift_in.recurrence_rule}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid RRULE format: {str(e)}"
            )

    # Update fields
    update_data = shift_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shift, field, value)

    db.commit()
    db.refresh(shift)

    return shift


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: UUID,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Delete shift.

    RBAC:
    - Only owner or admin can delete
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )

    # Verify pharmacy access
    await require_pharmacy_access(shift.pharmacy_id, current_user, db)

    db.delete(shift)
    db.commit()

    return None
