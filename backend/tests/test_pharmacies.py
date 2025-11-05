"""Tests for pharmacies API endpoints."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.models.pharmacy import Pharmacy
from app.models.user import User


class TestListPharmacies:
    """Test pharmacy listing endpoint."""

    def test_list_pharmacies_user(self, client: TestClient, test_user: User, auth_headers: dict, db_session):
        """Test user can list own pharmacies."""
        # Create pharmacy for user
        pharmacy = Pharmacy(
            user_id=test_user.id,
            name="Test Pharmacy",
            city="Milano",
            is_active=True
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.get("/api/v1/pharmacies", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Test Pharmacy"

    def test_list_pharmacies_admin_sees_all(
        self, client: TestClient, test_user: User, admin_user: User,
        admin_headers: dict, db_session
    ):
        """Test admin can see all pharmacies."""
        # Create pharmacy for regular user
        pharmacy1 = Pharmacy(
            user_id=test_user.id,
            name="User Pharmacy",
            is_active=True
        )
        # Create pharmacy for admin
        pharmacy2 = Pharmacy(
            user_id=admin_user.id,
            name="Admin Pharmacy",
            is_active=True
        )
        db_session.add_all([pharmacy1, pharmacy2])
        db_session.commit()

        response = client.get("/api/v1/pharmacies", headers=admin_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 2

    def test_list_pharmacies_search(
        self, client: TestClient, test_user: User, auth_headers: dict, db_session
    ):
        """Test search functionality."""
        pharmacy1 = Pharmacy(
            user_id=test_user.id,
            name="Farmacia Centrale",
            city="Milano",
            is_active=True
        )
        pharmacy2 = Pharmacy(
            user_id=test_user.id,
            name="Farmacia Periferia",
            city="Roma",
            is_active=True
        )
        db_session.add_all([pharmacy1, pharmacy2])
        db_session.commit()

        response = client.get(
            "/api/v1/pharmacies?search=Milano",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert "Milano" in data["items"][0]["city"]


class TestCreatePharmacy:
    """Test pharmacy creation endpoint."""

    def test_create_pharmacy_success(self, client: TestClient, auth_headers: dict):
        """Test successful pharmacy creation."""
        response = client.post(
            "/api/v1/pharmacies",
            headers=auth_headers,
            json={
                "name": "Farmacia Test",
                "address": "Via Roma 1",
                "city": "Milano",
                "postal_code": "20100",
                "phone": "+39 02 1234567",
                "email": "test@farmacia.it"
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Farmacia Test"
        assert data["city"] == "Milano"
        assert "id" in data

    def test_create_pharmacy_with_location(self, client: TestClient, auth_headers: dict):
        """Test pharmacy creation with GPS coordinates."""
        response = client.post(
            "/api/v1/pharmacies",
            headers=auth_headers,
            json={
                "name": "Farmacia Geolocalizzata",
                "city": "Milano",
                "location": {
                    "longitude": 9.1900,
                    "latitude": 45.4642
                }
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Farmacia Geolocalizzata"

    def test_create_pharmacy_no_auth(self, client: TestClient):
        """Test pharmacy creation requires authentication."""
        response = client.post(
            "/api/v1/pharmacies",
            json={"name": "Test"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdatePharmacy:
    """Test pharmacy update endpoint."""

    def test_update_pharmacy_success(
        self, client: TestClient, test_user: User, auth_headers: dict, db_session
    ):
        """Test successful pharmacy update."""
        pharmacy = Pharmacy(
            user_id=test_user.id,
            name="Old Name",
            is_active=True
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.put(
            f"/api/v1/pharmacies/{pharmacy.id}",
            headers=auth_headers,
            json={"name": "New Name"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "New Name"

    def test_update_pharmacy_access_denied(
        self, client: TestClient, admin_user: User, auth_headers: dict, db_session
    ):
        """Test user cannot update other user's pharmacy."""
        pharmacy = Pharmacy(
            user_id=admin_user.id,
            name="Admin Pharmacy",
            is_active=True
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.put(
            f"/api/v1/pharmacies/{pharmacy.id}",
            headers=auth_headers,
            json={"name": "Hacked Name"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestDeletePharmacy:
    """Test pharmacy deletion endpoint."""

    def test_delete_pharmacy_success(
        self, client: TestClient, test_user: User, auth_headers: dict, db_session
    ):
        """Test successful pharmacy deletion (soft delete)."""
        pharmacy = Pharmacy(
            user_id=test_user.id,
            name="To Delete",
            is_active=True
        )
        db_session.add(pharmacy)
        db_session.commit()

        response = client.delete(
            f"/api/v1/pharmacies/{pharmacy.id}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify soft delete
        db_session.refresh(pharmacy)
        assert pharmacy.is_active is False

    def test_delete_pharmacy_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent pharmacy."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.delete(
            f"/api/v1/pharmacies/{fake_uuid}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
