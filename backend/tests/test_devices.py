"""Tests for devices API endpoints."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.models.pharmacy import Pharmacy
from app.models.device import Device, DeviceStatus
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


class TestRegisterDevice:
    """Test device registration endpoint."""

    def test_register_device_admin_only(
        self, client: TestClient, auth_headers: dict, admin_headers: dict
    ):
        """Test only admin can register devices."""
        # User tries to register device
        response = client.post(
            "/api/v1/devices",
            headers=auth_headers,
            json={
                "serial_number": "TEST-001",
                "mac_address": "AA:BB:CC:DD:EE:FF"
            }
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Admin can register device
        response = client.post(
            "/api/v1/devices",
            headers=admin_headers,
            json={
                "serial_number": "TEST-001",
                "mac_address": "AA:BB:CC:DD:EE:FF"
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert len(data["activation_code"]) == 20
        assert data["status"] == "pending"
        assert data["serial_number"] == "TEST-001"

    def test_register_device_duplicate_serial(
        self, client: TestClient, admin_headers: dict, db_session
    ):
        """Test duplicate serial number rejection."""
        # Create existing device
        device = Device(
            serial_number="TEST-DUP",
            activation_code="EXISTING-CODE-12345",
            status=DeviceStatus.PENDING
        )
        db_session.add(device)
        db_session.commit()

        # Try to register with same serial
        response = client.post(
            "/api/v1/devices",
            headers=admin_headers,
            json={"serial_number": "TEST-DUP"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"]


class TestActivateDevice:
    """Test device activation endpoint."""

    def test_activate_device_success(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test successful device activation."""
        # Create pending device
        device = Device(
            serial_number="TEST-ACTIVATE",
            activation_code="VALID-CODE-12345678",
            status=DeviceStatus.PENDING
        )
        db_session.add(device)
        db_session.commit()

        # Activate device
        response = client.post(
            f"/api/v1/devices/{device.id}/activate",
            headers=auth_headers,
            json={
                "activation_code": "VALID-CODE-12345678",
                "pharmacy_id": str(test_pharmacy.id)
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "active"
        assert data["pharmacy_id"] == str(test_pharmacy.id)
        assert data["activated_at"] is not None

    def test_activate_device_invalid_code(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test activation with invalid code."""
        device = Device(
            serial_number="TEST-ACTIVATE-2",
            activation_code="CORRECT-CODE-123456",
            status=DeviceStatus.PENDING
        )
        db_session.add(device)
        db_session.commit()

        response = client.post(
            f"/api/v1/devices/{device.id}/activate",
            headers=auth_headers,
            json={
                "activation_code": "WRONG-CODE-1234567",
                "pharmacy_id": str(test_pharmacy.id)
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid activation code" in response.json()["detail"]

    def test_activate_device_already_active(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test activating already active device."""
        device = Device(
            serial_number="TEST-ALREADY-ACTIVE",
            activation_code="CODE-12345678901234",
            status=DeviceStatus.ACTIVE,
            pharmacy_id=test_pharmacy.id
        )
        db_session.add(device)
        db_session.commit()

        response = client.post(
            f"/api/v1/devices/{device.id}/activate",
            headers=auth_headers,
            json={
                "activation_code": "CODE-12345678901234",
                "pharmacy_id": str(test_pharmacy.id)
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already active" in response.json()["detail"]


class TestListDevices:
    """Test device listing endpoint."""

    def test_list_devices_user_sees_own(
        self, client: TestClient, test_user: User, test_pharmacy: Pharmacy,
        auth_headers: dict, admin_headers: dict, db_session
    ):
        """Test user sees only devices for own pharmacies."""
        # Create device for user's pharmacy
        device1 = Device(
            serial_number="USER-DEVICE",
            activation_code="CODE-1234567890123456",
            status=DeviceStatus.ACTIVE,
            pharmacy_id=test_pharmacy.id
        )
        db_session.add(device1)
        db_session.commit()

        response = client.get("/api/v1/devices", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["serial_number"] == "USER-DEVICE"

    def test_list_devices_filter_by_pharmacy(
        self, client: TestClient, test_pharmacy: Pharmacy, auth_headers: dict, db_session
    ):
        """Test filtering devices by pharmacy."""
        device = Device(
            serial_number="PHARMACY-DEVICE",
            activation_code="CODE-1234567890123456",
            status=DeviceStatus.ACTIVE,
            pharmacy_id=test_pharmacy.id
        )
        db_session.add(device)
        db_session.commit()

        response = client.get(
            f"/api/v1/devices?pharmacy_id={test_pharmacy.id}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1


class TestDeviceHeartbeat:
    """Test device heartbeat endpoint."""

    def test_device_heartbeat_no_auth(
        self, client: TestClient, test_pharmacy: Pharmacy, db_session
    ):
        """Test device heartbeat doesn't require auth."""
        device = Device(
            serial_number="HEARTBEAT-DEVICE",
            activation_code="CODE-1234567890123456",
            status=DeviceStatus.ACTIVE,
            pharmacy_id=test_pharmacy.id
        )
        db_session.add(device)
        db_session.commit()

        response = client.post(
            f"/api/v1/devices/{device.id}/heartbeat",
            json={
                "serial_number": "HEARTBEAT-DEVICE",
                "status": "active",
                "firmware_version": "1.0.0"
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["last_seen"] is not None
        assert data["firmware_version"] == "1.0.0"

    def test_device_heartbeat_serial_mismatch(
        self, client: TestClient, test_pharmacy: Pharmacy, db_session
    ):
        """Test heartbeat with wrong serial number."""
        device = Device(
            serial_number="CORRECT-SERIAL",
            activation_code="CODE-1234567890123456",
            status=DeviceStatus.ACTIVE,
            pharmacy_id=test_pharmacy.id
        )
        db_session.add(device)
        db_session.commit()

        response = client.post(
            f"/api/v1/devices/{device.id}/heartbeat",
            json={
                "serial_number": "WRONG-SERIAL",
                "status": "active"
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Serial number mismatch" in response.json()["detail"]
