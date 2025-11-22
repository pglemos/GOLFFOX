import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
VEHICLES_URL = f"{BASE_URL}/api/admin/vehicles"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_vehicle_deletion_or_archival_with_trip_validation():
    session = requests.Session()
    try:
        # Authenticate and get token
        login_payload = {
            "email": USERNAME,
            "password": PASSWORD
        }
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token returned in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Test cases:
        # 1. DELETE with invalid vehicle ID (not UUID)
        invalid_id = "invalid-uuid-123"
        resp_invalid = session.delete(f"{VEHICLES_URL}/{invalid_id}", headers=headers, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid vehicle ID, got {resp_invalid.status_code}"

        # 2. DELETE with non-existent but valid UUID vehicle ID - accept 200, 400, 404 or 409
        non_existent_id = str(uuid.uuid4())
        resp_nonexistent = session.delete(f"{VEHICLES_URL}/{non_existent_id}", headers=headers, timeout=TIMEOUT)
        assert resp_nonexistent.status_code in (200, 409, 400, 404), \
            f"Unexpected status for non-existent vehicle ID: {resp_nonexistent.status_code}"

        if resp_nonexistent.status_code == 200:
            data = resp_nonexistent.json()
            assert "success" in data and isinstance(data["success"], bool)
            assert "archived" in data and isinstance(data["archived"], bool)
            assert "tripsCount" in data and isinstance(data["tripsCount"], int)

    finally:
        session.close()


test_vehicle_deletion_or_archival_with_trip_validation()
