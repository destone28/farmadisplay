"""Create test data for TurnoTec."""
import requests
from datetime import date, time

BASE_URL = "http://localhost:8000/api/v1"

# Login
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"username": "admin", "password": "Admin1234"}
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create pharmacy
pharmacy_data = {
    "name": "Farmacia Centrale",
    "address": "Via Roma 123",
    "city": "Milano",
    "postal_code": "20100",
    "phone": "+39 02 12345678",
    "email": "info@farmaciacentrale.it",
    "location": {
        "longitude": 9.1859,
        "latitude": 45.4654
    }
}

pharmacy_response = requests.post(
    f"{BASE_URL}/pharmacies",
    json=pharmacy_data,
    headers=headers
)

if pharmacy_response.status_code != 201:
    print(f"Error creating pharmacy: {pharmacy_response.status_code}")
    print(pharmacy_response.text)
    exit(1)

pharmacy = pharmacy_response.json()
pharmacy_id = pharmacy["id"]
print(f"✓ Pharmacy created: {pharmacy['name']} (ID: {pharmacy_id})")

# Create shift for today
today = date.today()
shift_data = {
    "pharmacy_id": pharmacy_id,
    "date": str(today),
    "start_time": "09:00:00",
    "end_time": "20:00:00",
    "is_recurring": False,
    "notes": "Turno di prova"
}

shift_response = requests.post(
    f"{BASE_URL}/shifts",
    json=shift_data,
    headers=headers
)
shift = shift_response.json()
print(f"✓ Shift created: {shift['date']} {shift['start_time']}-{shift['end_time']}")

print(f"\n=== Test Data Created ===")
print(f"Pharmacy ID: {pharmacy_id}")
print(f"Login credentials: admin / Admin1234")
print(f"\nTest URLs:")
print(f"- Frontend: http://localhost:5173/")
print(f"- Display: http://localhost:8080/?id={pharmacy_id}")
print(f"- API Docs: http://localhost:8000/api/docs")
