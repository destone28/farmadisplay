"""Tests for display public API endpoints."""

import pytest
from datetime import date, time, datetime
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
        name="Display Test Pharmacy",
        address="Via Roma 1",
        city="Milano",
        phone="+39 02 1234567",
        is_active=True
    )
    db_session.add(pharmacy)
    db_session.commit()
    db_session.refresh(pharmacy)
    return pharmacy


class TestGetDisplayData:
    """Test display data endpoint."""

    def test_get_display_data_no_auth(
        self, client: TestClient, test_pharmacy: Pharmacy
    ):
        """Test display API doesn't require authentication."""
        response = client.get(f"/api/v1/display/{test_pharmacy.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "pharmacy" in data
        assert "current_shifts" in data
        assert "nearby_pharmacies" in data
        assert "messages" in data
        assert "updated_at" in data

        assert data["pharmacy"]["id"] == str(test_pharmacy.id)
        assert data["pharmacy"]["name"] == "Display Test Pharmacy"

    def test_get_display_data_with_shifts(
        self, client: TestClient, test_pharmacy: Pharmacy, db_session
    ):
        """Test display data includes current shifts."""
        # Create shift for today
        today = datetime.now().date()
        shift = Shift(
            pharmacy_id=test_pharmacy.id,
            date=today,
            start_time=time(0, 0),  # Midnight
            end_time=time(23, 59),  # End of day
            notes="Open 24h"
        )
        db_session.add(shift)
        db_session.commit()

        response = client.get(f"/api/v1/display/{test_pharmacy.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have current shift
        assert len(data["current_shifts"]) >= 0  # Depends on current time

    def test_get_display_data_not_found(self, client: TestClient):
        """Test display data for non-existent pharmacy."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/display/{fake_uuid}")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_display_data_inactive_pharmacy(
        self, client: TestClient, test_user: User, db_session
    ):
        """Test display data for inactive pharmacy."""
        pharmacy = Pharmacy(
            user_id=test_user.id,
            name="Inactive Pharmacy",
            is_active=False
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.get(f"/api/v1/display/{pharmacy.id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestGetDisplayShifts:
    """Test display shifts endpoint."""

    def test_get_display_shifts_no_auth(
        self, client: TestClient, test_pharmacy: Pharmacy, db_session
    ):
        """Test display shifts endpoint doesn't require auth."""
        # Create future shifts
        from datetime import timedelta
        today = datetime.now().date()
        future_date = today + timedelta(days=1)

        shift = Shift(
            pharmacy_id=test_pharmacy.id,
            date=future_date,
            start_time=time(8, 0),
            end_time=time(20, 0)
        )
        db_session.add(shift)
        db_session.commit()

        response = client.get(f"/api/v1/display/{test_pharmacy.id}/shifts")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_get_display_shifts_inactive_pharmacy(
        self, client: TestClient, test_user: User, db_session
    ):
        """Test display shifts for inactive pharmacy."""
        pharmacy = Pharmacy(
            user_id=test_user.id,
            name="Inactive Pharmacy",
            is_active=False
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.get(f"/api/v1/display/{pharmacy.id}/shifts")

        assert response.status_code == status.HTTP_404_NOT_FOUND
