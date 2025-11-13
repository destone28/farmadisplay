# TurnoTec API Documentation

Complete API reference for TurnoTec backend.

## 🔐 Authentication

All endpoints (except `/display` and `/health`) require JWT authentication.

### Get Token

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Use Token

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/pharmacies
```

---

## 💊 Pharmacies API

### List Pharmacies

```http
GET /api/v1/pharmacies?skip=0&limit=20&search=milano
```

**Query Parameters:**
- `skip` (int, default: 0) - Number of items to skip
- `limit` (int, default: 20, max: 100) - Number of items to return
- `search` (string, optional) - Search in name, city, address

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Farmacia Centrale",
      "address": "Via Roma 1",
      "city": "Milano",
      "postal_code": "20100",
      "phone": "+39 02 1234567",
      "email": "info@farmacia.it",
      "logo_url": "https://...",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": null
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 20,
  "has_more": true
}
```

### Create Pharmacy

```http
POST /api/v1/pharmacies
```

**Body:**
```json
{
  "name": "Farmacia Test",
  "address": "Via Roma 1",
  "city": "Milano",
  "postal_code": "20100",
  "phone": "+39 02 1234567",
  "email": "test@farmacia.it",
  "location": {
    "longitude": 9.1900,
    "latitude": 45.4642
  },
  "logo_url": "https://example.com/logo.png"
}
```

### Update Pharmacy

```http
PUT /api/v1/pharmacies/{pharmacy_id}
```

**Body:** (all fields optional)
```json
{
  "name": "New Name",
  "city": "Roma",
  "is_active": false
}
```

### Delete Pharmacy

```http
DELETE /api/v1/pharmacies/{pharmacy_id}
```

Soft delete - sets `is_active=false` and deactivates all devices.

---

## 📅 Shifts API

### List Shifts

```http
GET /api/v1/shifts?pharmacy_id={uuid}&start_date=2025-01-15&end_date=2025-01-22
```

**Query Parameters:**
- `pharmacy_id` (uuid, required) - Pharmacy UUID
- `start_date` (date, required) - Start date (ISO 8601)
- `end_date` (date, required) - End date (ISO 8601)

**Response:**
```json
[
  {
    "id": "uuid",
    "pharmacy_id": "uuid",
    "date": "2025-01-15",
    "start_time": "08:00:00",
    "end_time": "20:00:00",
    "is_recurring": false,
    "recurrence_rule": null,
    "notes": "Turno diurno",
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": null
  }
]
```

### Create Shift

```http
POST /api/v1/shifts
```

**Body (Simple Shift):**
```json
{
  "pharmacy_id": "uuid",
  "date": "2025-01-15",
  "start_time": "08:00:00",
  "end_time": "20:00:00",
  "is_recurring": false,
  "notes": "Turno diurno"
}
```

**Body (Recurring Shift):**
```json
{
  "pharmacy_id": "uuid",
  "date": "2025-01-15",
  "start_time": "08:00:00",
  "end_time": "20:00:00",
  "is_recurring": true,
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
  "notes": "Turno settimanale"
}
```

**RRULE Examples:**
- Daily: `FREQ=DAILY`
- Weekly (Mon/Wed/Fri): `FREQ=WEEKLY;BYDAY=MO,WE,FR`
- Monthly (first Monday): `FREQ=MONTHLY;BYDAY=1MO`
- Until date: `FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231`

### Update Shift

```http
PUT /api/v1/shifts/{shift_id}
```

### Delete Shift

```http
DELETE /api/v1/shifts/{shift_id}
```

---

## 📱 Devices API

### Register Device (Admin Only)

```http
POST /api/v1/devices
```

**Body:**
```json
{
  "serial_number": "RPI-001",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0"
}
```

**Response:**
```json
{
  "id": "uuid",
  "serial_number": "RPI-001",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "activation_code": "ABCD1234EFGH5678IJKL",
  "pharmacy_id": null,
  "status": "pending",
  "last_seen": null,
  "firmware_version": "1.0.0",
  "created_at": "2025-01-15T10:00:00Z",
  "activated_at": null
}
```

### Activate Device

```http
POST /api/v1/devices/{device_id}/activate
```

**Body:**
```json
{
  "activation_code": "ABCD1234EFGH5678IJKL",
  "pharmacy_id": "uuid"
}
```

### List Devices

```http
GET /api/v1/devices?pharmacy_id={uuid}&status=active
```

**Query Parameters:**
- `pharmacy_id` (uuid, optional) - Filter by pharmacy
- `status` (enum, optional) - Filter by status (pending/active/inactive/maintenance)

### Device Heartbeat (No Auth)

```http
POST /api/v1/devices/{device_id}/heartbeat
```

**Body:**
```json
{
  "serial_number": "RPI-001",
  "status": "active",
  "firmware_version": "1.0.0"
}
```

Called periodically by devices to update status and last_seen timestamp.

### Update Device Status (Admin Only)

```http
PUT /api/v1/devices/{device_id}/status
```

**Body:**
```json
{
  "status": "maintenance"
}
```

### Delete Device (Admin Only)

```http
DELETE /api/v1/devices/{device_id}
```

---

## 🗺️ Display Public API (No Auth)

### Get Display Data

```http
GET /api/v1/display/{pharmacy_id}
```

**Response:**
```json
{
  "pharmacy": {
    "id": "uuid",
    "name": "Farmacia Centrale",
    "address": "Via Roma 1",
    "city": "Milano",
    "phone": "+39 02 1234567",
    "logo_url": "https://..."
  },
  "current_shifts": [
    {
      "date": "2025-01-15",
      "start_time": "08:00:00",
      "end_time": "20:00:00",
      "notes": "Turno diurno"
    }
  ],
  "nearby_pharmacies": [
    {
      "id": "uuid",
      "name": "Farmacia Vicina",
      "address": "Via Milano 5",
      "city": "Milano",
      "phone": "+39 02 7654321",
      "distance_meters": 1250.5
    }
  ],
  "messages": [],
  "updated_at": "2025-01-15T14:30:00Z"
}
```

**Features:**
- Current shifts (based on current date/time)
- Nearby pharmacies within 5km radius (PostGIS)
- No authentication required
- Optimized for frequent polling

### Get Upcoming Shifts

```http
GET /api/v1/display/{pharmacy_id}/shifts
```

Returns shifts for the next 7 days.

---

## ❤️ Health Check

### Basic Health

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Detailed Health

```http
GET /api/v1/health/detailed
```

**Response:**
```json
{
  "api": "healthy",
  "database": "healthy",
  "redis": "healthy"
}
```

---

## 🔒 RBAC (Role-Based Access Control)

### USER Role
- ✅ Manage own pharmacies (CRUD)
- ✅ Manage shifts for own pharmacies
- ✅ Activate devices on own pharmacies
- ✅ View devices for own pharmacies
- ❌ Register new devices
- ❌ View/modify other users' resources

### ADMIN Role
- ✅ All USER permissions
- ✅ View all pharmacies
- ✅ View all shifts
- ✅ View all devices
- ✅ Register new devices
- ✅ Manually update device status
- ✅ Delete devices

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "detail": "end_time must be after start_time"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied"
}
```

### 404 Not Found
```json
{
  "detail": "Pharmacy not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded. Maximum 100 requests per minute."
}
```

---

## 📊 Testing

### Run All Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v --cov=app
```

### Run Specific Test Suite

```bash
# Auth tests
pytest tests/test_auth.py -v

# Pharmacy tests
pytest tests/test_pharmacies.py -v

# Shift tests
pytest tests/test_shifts.py -v

# Device tests
pytest tests/test_devices.py -v

# Display tests
pytest tests/test_display.py -v
```

### Coverage Report

```bash
pytest --cov=app --cov-report=html tests/
open htmlcov/index.html
```

---

## 🌐 Interactive API Docs

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

---

## 📞 Support

- Email: admin@turnotec.com
- GitHub: https://github.com/destone28/turnotec
- Issues: https://github.com/destone28/turnotec/issues
