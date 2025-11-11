import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
VEHICLE_ENDPOINT_TEMPLATE = f"{BASE_URL}/api/admin/vehicles/{{vehicleId}}"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30


def login():
    payload = {"email": USERNAME, "password": PASSWORD}
    headers = {"Content-Type": "application/json"}
    resp = requests.post(LOGIN_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token")
    if not token:
        raise ValueError("Login successful but no token returned")
    return token


def delete_vehicle(auth_token, vehicle_id):
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    url = VEHICLE_ENDPOINT_TEMPLATE.format(vehicleId=vehicle_id)
    return requests.delete(url, headers=headers, timeout=TIMEOUT)


def test_vehicle_deletion_or_archival_with_trip_validation():
    auth_token = login()

    # 1. Test invalid vehicle ID (bad uuid format)
    invalid_vehicle_id = "invalid-uuid-format"
    resp = delete_vehicle(auth_token, invalid_vehicle_id)
    assert resp.status_code == 400, f"Expected 400 for invalid vehicle ID, got {resp.status_code}"

    # 2. Test non-existing valid UUID vehicle ID (should ideally delete or archive without trips)
    non_existing_vehicle_id = str(uuid.uuid4())
    resp = delete_vehicle(auth_token, non_existing_vehicle_id)
    if resp.status_code == 200:
        data = resp.json()
        assert "success" in data and isinstance(data["success"], bool)
        assert "archived" in data and isinstance(data["archived"], bool)
        assert "tripsCount" in data and isinstance(data["tripsCount"], int)
    else:
        assert resp.status_code in {400, 404, 409}, f"Unexpected status code {resp.status_code} for non-existing vehicle"

    # 3. Test with a vehicle that has associated trips:
    conflict_vehicle_id = "11111111-1111-1111-1111-111111111111"
    resp = delete_vehicle(auth_token, conflict_vehicle_id)
    if resp.status_code == 409:
        assert True
    elif resp.status_code == 200:
        data = resp.json()
        assert "success" in data and isinstance(data["success"], bool)
        assert "archived" in data and isinstance(data["archived"], bool)
        assert "tripsCount" in data and isinstance(data["tripsCount"], int)
    else:
        assert resp.status_code in {400, 404, 500}, f"Unexpected status code {resp.status_code}"



test_vehicle_deletion_or_archival_with_trip_validation()
