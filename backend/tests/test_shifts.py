"""Tests for shifts API endpoints."""

import pytest
from datetime import date, time
from fastapi import status
from fastapi.testclient import TestClient

from app.models.pharmacy import Pharmacy
from app.models.shift import Shift
from app.models.user import User


@pytest.fixture
def test_pharmacy(test_user: User, db_session) -> Pharmacy:
    """Create a test pharmacy."""
    pharmacy = Pharmacy(
        user_id=test_user.id,
        name="Test Pharmacy",
        is_active=True
    )
    db_session.add(pharmacy)
    db_session.commit()
    db_session.refresh(pharmacy)
    return pharmacy


class TestListShifts:
    """Test shift listing endpoint."""

    def test_list_shifts_success(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test successful shift listing."""
        # Create shifts
        shift1 = Shift(
            pharmacy_id=test_pharmacy.id,
            date=date(2025, 11, 10),
            start_time=time(8, 0),
            end_time=time(20, 0)
        )
        shift2 = Shift(
            pharmacy_id=test_pharmacy.id,
            date=date(2025, 11, 11),
            start_time=time(8, 0),
            end_time=time(20, 0)
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        response = client.get(
            f"/api/v1/shifts?pharmacy_id={test_pharmacy.id}"
            f"&start_date=2025-11-10&end_date=2025-11-12",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2

    def test_list_shifts_invalid_date_range(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test invalid date range."""
        response = client.get(
            f"/api/v1/shifts?pharmacy_id={test_pharmacy.id}"
            f"&start_date=2025-11-12&end_date=2025-11-10",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestCreateShift:
    """Test shift creation endpoint."""

    def test_create_shift_success(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test successful shift creation."""
        response = client.post(
            "/api/v1/shifts",
            headers=auth_headers,
            json={
                "pharmacy_id": str(test_pharmacy.id),
                "date": "2025-11-10",
                "start_time": "08:00:00",
                "end_time": "20:00:00",
                "is_recurring": False
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["date"] == "2025-11-10"
        assert data["start_time"] == "08:00:00"
        assert data["end_time"] == "20:00:00"

    def test_create_shift_invalid_time_range(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test end_time must be after start_time."""
        response = client.post(
            "/api/v1/shifts",
            headers=auth_headers,
            json={
                "pharmacy_id": str(test_pharmacy.id),
                "date": "2025-11-10",
                "start_time": "20:00:00",
                "end_time": "08:00:00"  # Invalid!
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "end_time must be after start_time" in response.json()["detail"]

    def test_create_recurring_shift_with_rrule(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test recurring shift with RRULE."""
        response = client.post(
            "/api/v1/shifts",
            headers=auth_headers,
            json={
                "pharmacy_id": str(test_pharmacy.id),
                "date": "2025-11-10",
                "start_time": "08:00:00",
                "end_time": "20:00:00",
                "is_recurring": True,
                "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["is_recurring"] is True
        assert "FREQ=WEEKLY" in data["recurrence_rule"]

    def test_create_recurring_shift_missing_rrule(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test recurring shift requires recurrence_rule."""
        response = client.post(
            "/api/v1/shifts",
            headers=auth_headers,
            json={
                "pharmacy_id": str(test_pharmacy.id),
                "date": "2025-11-10",
                "start_time": "08:00:00",
                "end_time": "20:00:00",
                "is_recurring": True
                # Missing recurrence_rule!
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "recurrence_rule required" in response.json()["detail"]

    def test_create_shift_invalid_rrule(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict
    ):
        """Test invalid RRULE format."""
        response = client.post(
            "/api/v1/shifts",
            headers=auth_headers,
            json={
                "pharmacy_id": str(test_pharmacy.id),
                "date": "2025-11-10",
                "start_time": "08:00:00",
                "end_time": "20:00:00",
                "is_recurring": True,
                "recurrence_rule": "INVALID_RRULE"
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid RRULE format" in response.json()["detail"]


class TestUpdateShift:
    """Test shift update endpoint."""

    def test_update_shift_success(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test successful shift update."""
        shift = Shift(
            pharmacy_id=test_pharmacy.id,
            date=date(2025, 11, 10),
            start_time=time(8, 0),
            end_time=time(20, 0)
        )
        db_session.add(shift)
        db_session.commit()

        response = client.put(
            f"/api/v1/shifts/{shift.id}",
            headers=auth_headers,
            json={"notes": "Updated notes"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["notes"] == "Updated notes"


class TestDeleteShift:
    """Test shift deletion endpoint."""

    def test_delete_shift_success(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test successful shift deletion."""
        shift = Shift(
            pharmacy_id=test_pharmacy.id,
            date=date(2025, 11, 10),
            start_time=time(8, 0),
            end_time=time(20, 0)
        )
        db_session.add(shift)
        db_session.commit()

        response = client.delete(
            f"/api/v1/shifts/{shift.id}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deletion
        assert db_session.query(Shift).filter(Shift.id == shift.id).first() is None
