import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH = ("golffox@admin.com", "senha123")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_vehicle_deletion_or_archival_with_trip_validation():
    # Authenticate and obtain a token via login
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": AUTH[0],
        "password": AUTH[1]
    }
    login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
    login_json = login_resp.json()
    token = login_json.get("token")
    assert token, "No token returned from login"
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # 1. Deletion with invalid vehicleId (should return 400)
    invalid_vehicle_id = "invalid-uuid"
    invalid_url = f"{BASE_URL}/api/admin/vehicles/{invalid_vehicle_id}"
    resp_invalid = requests.delete(invalid_url, headers=auth_headers, timeout=TIMEOUT)
    assert resp_invalid.status_code == 400, f"Expected 400 for invalid vehicleId, got {resp_invalid.status_code}"

    # 2. Deletion with a non-existing valid UUID vehicleId (should return 400)
    non_exist_id = str(uuid.uuid4())
    non_exist_url = f"{BASE_URL}/api/admin/vehicles/{non_exist_id}"
    resp_non_exist = requests.delete(non_exist_url, headers=auth_headers, timeout=TIMEOUT)
    assert resp_non_exist.status_code == 400, f"Expected 400 for non-existing vehicleId, got {resp_non_exist.status_code}"


test_vehicle_deletion_or_archival_with_trip_validation()
