"""
Backend Performance Tests
Tests API response times and database query performance
"""
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.database import get_db


client = TestClient(app)


class TestAPIPerformance:
    """Test API endpoint response times"""

    def setup_method(self):
        """Setup test data and authenticate"""
        # Login to get token
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@farmadisplay.com", "password": "AdminPassword123!"}
        )
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_auth_login_performance(self):
        """Login should complete in under 200ms"""
        start_time = time.time()

        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@farmadisplay.com", "password": "AdminPassword123!"}
        )

        elapsed = (time.time() - start_time) * 1000  # Convert to ms

        assert response.status_code == 200
        assert elapsed < 200, f"Login took {elapsed:.2f}ms, expected < 200ms"
        print(f"\n✓ Login: {elapsed:.2f}ms")

    def test_pharmacies_list_performance(self):
        """GET /pharmacies should respond in under 200ms"""
        start_time = time.time()

        response = client.get("/api/v1/pharmacies", headers=self.headers)

        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 200, f"Pharmacies list took {elapsed:.2f}ms, expected < 200ms"
        print(f"\n✓ GET /pharmacies: {elapsed:.2f}ms")

    def test_pharmacies_detail_performance(self):
        """GET /pharmacies/{id} should respond in under 150ms"""
        # Get first pharmacy ID
        response = client.get("/api/v1/pharmacies", headers=self.headers)
        pharmacies = response.json()
        if not pharmacies:
            pytest.skip("No pharmacies available for testing")

        pharmacy_id = pharmacies[0]["id"]

        start_time = time.time()
        response = client.get(f"/api/v1/pharmacies/{pharmacy_id}", headers=self.headers)
        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 150, f"Pharmacy detail took {elapsed:.2f}ms, expected < 150ms"
        print(f"\n✓ GET /pharmacies/:id: {elapsed:.2f}ms")

    def test_shifts_list_performance(self):
        """GET /shifts should respond in under 300ms"""
        start_time = time.time()

        response = client.get("/api/v1/shifts", headers=self.headers)

        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 300, f"Shifts list took {elapsed:.2f}ms, expected < 300ms"
        print(f"\n✓ GET /shifts: {elapsed:.2f}ms")

    def test_devices_list_performance(self):
        """GET /devices should respond in under 200ms"""
        start_time = time.time()

        response = client.get("/api/v1/devices", headers=self.headers)

        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 200, f"Devices list took {elapsed:.2f}ms, expected < 200ms"
        print(f"\n✓ GET /devices: {elapsed:.2f}ms")

    def test_display_endpoint_performance(self):
        """GET /display/{pharmacy_id} should respond in under 250ms"""
        # Get first pharmacy ID
        response = client.get("/api/v1/pharmacies", headers=self.headers)
        pharmacies = response.json()
        if not pharmacies:
            pytest.skip("No pharmacies available for testing")

        pharmacy_id = pharmacies[0]["id"]

        start_time = time.time()
        response = client.get(f"/api/v1/display/{pharmacy_id}")
        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 250, f"Display endpoint took {elapsed:.2f}ms, expected < 250ms"
        print(f"\n✓ GET /display/:id: {elapsed:.2f}ms")

    def test_heartbeat_performance(self):
        """POST /devices/{id}/heartbeat should respond in under 150ms"""
        # Get first device ID
        response = client.get("/api/v1/devices", headers=self.headers)
        devices = response.json()
        if not devices:
            pytest.skip("No devices available for testing")

        device_id = devices[0]["id"]

        start_time = time.time()
        response = client.post(
            f"/api/v1/devices/{device_id}/heartbeat",
            json={
                "serial_number": devices[0]["serial_number"],
                "status": "active",
                "firmware_version": "1.0.0"
            }
        )
        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 150, f"Heartbeat took {elapsed:.2f}ms, expected < 150ms"
        print(f"\n✓ POST /devices/:id/heartbeat: {elapsed:.2f}ms")

    def test_concurrent_requests_performance(self):
        """Test handling 50 concurrent requests"""
        import concurrent.futures

        def make_request():
            start = time.time()
            response = client.get("/api/v1/pharmacies", headers=self.headers)
            elapsed = (time.time() - start) * 1000
            return response.status_code, elapsed

        start_time = time.time()

        # Execute 50 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        total_elapsed = (time.time() - start_time) * 1000

        # All should succeed
        assert all(status == 200 for status, _ in results), "Some requests failed"

        # Calculate stats
        response_times = [elapsed for _, elapsed in results]
        avg_time = sum(response_times) / len(response_times)
        p95_time = sorted(response_times)[int(len(response_times) * 0.95)]

        print(f"\n✓ 50 concurrent requests:")
        print(f"  Total time: {total_elapsed:.2f}ms")
        print(f"  Average response: {avg_time:.2f}ms")
        print(f"  P95 response: {p95_time:.2f}ms")

        # Assertions
        assert avg_time < 200, f"Average response time {avg_time:.2f}ms exceeds 200ms"
        assert p95_time < 500, f"P95 response time {p95_time:.2f}ms exceeds 500ms"

    def test_pagination_performance(self):
        """Test pagination performance with large result sets"""
        start_time = time.time()

        response = client.get(
            "/api/v1/pharmacies",
            headers=self.headers,
            params={"skip": 0, "limit": 100}
        )

        elapsed = (time.time() - start_time) * 1000

        assert response.status_code == 200
        assert elapsed < 300, f"Pagination took {elapsed:.2f}ms, expected < 300ms"
        print(f"\n✓ Pagination (limit=100): {elapsed:.2f}ms")


class TestDatabasePerformance:
    """Test database query performance"""

    @pytest.fixture(autouse=True)
    def db_session(self):
        """Get database session for direct queries"""
        db = next(get_db())
        yield db
        db.close()

    def test_pharmacy_query_performance(self, db_session):
        """Direct pharmacy queries should complete in under 50ms"""
        start_time = time.time()

        result = db_session.execute(
            text("SELECT * FROM pharmacies LIMIT 100")
        )
        pharmacies = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(pharmacies) >= 0
        assert elapsed < 50, f"Pharmacy query took {elapsed:.2f}ms, expected < 50ms"
        print(f"\n✓ SELECT pharmacies: {elapsed:.2f}ms")

    def test_shifts_query_performance(self, db_session):
        """Shifts queries with date filter should complete in under 100ms"""
        start_time = time.time()

        result = db_session.execute(
            text("""
                SELECT * FROM shifts
                WHERE date >= CURRENT_DATE
                AND date <= CURRENT_DATE + INTERVAL '7 days'
                LIMIT 100
            """)
        )
        shifts = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(shifts) >= 0
        assert elapsed < 100, f"Shifts query took {elapsed:.2f}ms, expected < 100ms"
        print(f"\n✓ SELECT shifts (filtered): {elapsed:.2f}ms")

    def test_nearby_pharmacies_query_performance(self, db_session):
        """PostGIS nearby query should complete in under 150ms"""
        # Test coordinates (Milan center)
        lat, lon = 45.4642, 9.1900

        start_time = time.time()

        result = db_session.execute(
            text("""
                SELECT
                    id,
                    name,
                    ST_Distance(
                        location::geography,
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                    ) / 1000 as distance_km
                FROM pharmacies
                WHERE ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                    5000
                )
                ORDER BY distance_km
                LIMIT 10
            """),
            {"lat": lat, "lon": lon}
        )
        nearby = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(nearby) >= 0
        assert elapsed < 150, f"Nearby query took {elapsed:.2f}ms, expected < 150ms"
        print(f"\n✓ SELECT nearby (PostGIS): {elapsed:.2f}ms")

    def test_join_query_performance(self, db_session):
        """Complex join queries should complete in under 200ms"""
        start_time = time.time()

        result = db_session.execute(
            text("""
                SELECT
                    s.id,
                    s.date,
                    s.start_time,
                    s.end_time,
                    p.name as pharmacy_name,
                    p.address
                FROM shifts s
                JOIN pharmacies p ON s.pharmacy_id = p.id
                WHERE s.date >= CURRENT_DATE
                ORDER BY s.date, s.start_time
                LIMIT 100
            """)
        )
        shifts = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(shifts) >= 0
        assert elapsed < 200, f"Join query took {elapsed:.2f}ms, expected < 200ms"
        print(f"\n✓ SELECT with JOIN: {elapsed:.2f}ms")

    def test_aggregate_query_performance(self, db_session):
        """Aggregate queries should complete in under 100ms"""
        start_time = time.time()

        result = db_session.execute(
            text("""
                SELECT
                    pharmacy_id,
                    COUNT(*) as shift_count,
                    MIN(date) as first_shift,
                    MAX(date) as last_shift
                FROM shifts
                GROUP BY pharmacy_id
                LIMIT 100
            """)
        )
        stats = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(stats) >= 0
        assert elapsed < 100, f"Aggregate query took {elapsed:.2f}ms, expected < 100ms"
        print(f"\n✓ SELECT with aggregates: {elapsed:.2f}ms")

    def test_full_text_search_performance(self, db_session):
        """Full-text search should complete in under 100ms"""
        start_time = time.time()

        result = db_session.execute(
            text("""
                SELECT * FROM pharmacies
                WHERE name ILIKE :search OR address ILIKE :search
                LIMIT 20
            """),
            {"search": "%farmacia%"}
        )
        results = result.fetchall()

        elapsed = (time.time() - start_time) * 1000

        assert len(results) >= 0
        assert elapsed < 100, f"Search query took {elapsed:.2f}ms, expected < 100ms"
        print(f"\n✓ Full-text search: {elapsed:.2f}ms")

    def test_index_usage(self, db_session):
        """Verify important indexes exist"""
        result = db_session.execute(
            text("""
                SELECT
                    tablename,
                    indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND tablename IN ('pharmacies', 'shifts', 'devices')
                ORDER BY tablename, indexname
            """)
        )
        indexes = result.fetchall()

        # Verify key indexes exist
        index_names = [idx[1] for idx in indexes]

        # Check for primary keys
        assert any('pkey' in idx for idx in index_names), "Missing primary key indexes"

        print(f"\n✓ Found {len(indexes)} indexes on key tables")
        for table, index in indexes:
            print(f"  {table}.{index}")


class TestLoadPerformance:
    """Test system performance under load"""

    def setup_method(self):
        """Setup authentication"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@farmadisplay.com", "password": "AdminPassword123!"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_sustained_load_performance(self):
        """Test performance under sustained load (100 requests over 10 seconds)"""
        import concurrent.futures

        request_count = 100
        duration_target = 10  # seconds

        def make_timed_request():
            start = time.time()
            response = client.get("/api/v1/pharmacies", headers=self.headers)
            elapsed = (time.time() - start) * 1000
            return response.status_code, elapsed

        start_time = time.time()

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_timed_request) for _ in range(request_count)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        total_elapsed = time.time() - start_time

        # Calculate stats
        success_count = sum(1 for status, _ in results if status == 200)
        response_times = [elapsed for _, elapsed in results]
        avg_time = sum(response_times) / len(response_times)
        p95_time = sorted(response_times)[int(len(response_times) * 0.95)]
        p99_time = sorted(response_times)[int(len(response_times) * 0.99)]
        throughput = request_count / total_elapsed

        print(f"\n✓ Sustained load test ({request_count} requests):")
        print(f"  Total time: {total_elapsed:.2f}s")
        print(f"  Success rate: {success_count}/{request_count} ({success_count/request_count*100:.1f}%)")
        print(f"  Throughput: {throughput:.2f} req/s")
        print(f"  Average response: {avg_time:.2f}ms")
        print(f"  P95 response: {p95_time:.2f}ms")
        print(f"  P99 response: {p99_time:.2f}ms")

        # Assertions
        assert success_count == request_count, f"Only {success_count}/{request_count} requests succeeded"
        assert avg_time < 300, f"Average response time {avg_time:.2f}ms exceeds 300ms"
        assert p95_time < 500, f"P95 response time {p95_time:.2f}ms exceeds 500ms"
        assert throughput > 5, f"Throughput {throughput:.2f} req/s is below 5 req/s"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
