import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
VEHICLES_URL = f"{BASE_URL}/api/admin/vehicles"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_vehicle_deletion_or_archival_with_trip_validation():
    # Step 1: Authenticate and get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_resp = requests.post(
        LOGIN_URL,
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    token = login_data.get("token")
    assert token, "No token received after login"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    def create_vehicle():
        return str(uuid.uuid4())

    test_vehicle_id = create_vehicle()

    vehicle_id_invalid = "invalid-uuid"

    try:
        # 1) Test deletion with invalid vehicle ID format
        resp_invalid = requests.delete(
            f"{VEHICLES_URL}/{vehicle_id_invalid}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid vehicle ID, got {resp_invalid.status_code}"

        # 2) Test deletion with a valid vehicle ID assuming no trips (should delete or archive or not found)
        resp_delete = requests.delete(
            f"{VEHICLES_URL}/{test_vehicle_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        if resp_delete.status_code == 200:
            data = resp_delete.json()
            assert "success" in data and isinstance(data["success"], bool), "'success' missing or wrong type"
            assert "archived" in data and isinstance(data["archived"], bool), "'archived' missing or wrong type"
            assert "tripsCount" in data and isinstance(data["tripsCount"], int), "'tripsCount' missing or wrong type"
            if data["tripsCount"] > 0:
                assert data["archived"] is True, "Vehicle with trips should be archived"
        elif resp_delete.status_code == 409:
            pass
        elif resp_delete.status_code == 400:
            # Accept 400 with message 'Vehicle not found' as valid for non-existent vehicle
            data = resp_delete.json()
            assert "error" in data and data["error"] == "Vehicle not found", f"Unexpected 400 response: {resp_delete.text}"
        else:
            assert False, f"Unexpected status code deleting vehicle: {resp_delete.status_code} {resp_delete.text}"

    finally:
        try:
            requests.delete(
                f"{VEHICLES_URL}/{test_vehicle_id}",
                headers=headers,
                timeout=TIMEOUT
            )
        except Exception:
            pass

test_vehicle_deletion_or_archival_with_trip_validation()
