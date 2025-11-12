import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
VEHICLES_URL = f"{BASE_URL}/api/admin/vehicles"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"


def obtain_auth_token():
    resp = requests.post(
        LOGIN_URL,
        json={"email": USERNAME, "password": PASSWORD},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token")
    if not token:
        raise ValueError("Login response missing auth token")
    return token


def create_vehicle(auth_token):
    """
    Helper function to create a vehicle to use in tests.
    We assume minimal vehicle creation via POST /api/admin/vehicles or similar.
    Since no creation endpoint given in PRD, simulate with minimal data POST /api/admin/vehicles
    If not possible, create via some test-only or fallback method.
    For this test, we will attempt POST to /api/admin/vehicles for vehicle creation.
    """
    url = f"{BASE_URL}/api/admin/vehicles"
    headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    # Minimal example vehicle data, assuming required fields
    payload = {
        "plate": f"TEST-{uuid.uuid4().hex[:6].upper()}",
        "model": "Test Model",
        "make": "Test Make",
        "year": 2020,
        "status": "active"
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    vehicle = resp.json()
    vehicle_id = vehicle.get("id") or vehicle.get("vehicleId")
    if not vehicle_id:
        raise ValueError("Created vehicle response missing id")
    return vehicle_id


def delete_vehicle(auth_token, vehicle_id):
    url = f"{VEHICLES_URL}/{vehicle_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    resp = requests.delete(url, headers=headers, timeout=30)
    return resp


def test_vehicle_deletion_or_archival_with_trip_validation():
    # Obtain auth token for Bearer authentication
    auth_token = obtain_auth_token()

    headers = {"Authorization": f"Bearer {auth_token}"}

    # Case 1: Test invalid vehicle ID format
    invalid_vehicle_id = "not-a-uuid"
    url_invalid = f"{VEHICLES_URL}/{invalid_vehicle_id}"
    resp_invalid = requests.delete(url_invalid, headers=headers, timeout=30)
    assert resp_invalid.status_code == 400, f"Expected 400 for invalid vehicle ID, got {resp_invalid.status_code}"

    # Case 2: Test deletion or archival of a vehicle that has associated trips
    # First, create a new vehicle that presumably will have no trips initially
    vehicle_id = None
    # Note: The PRD does not provide vehicle creation endpoint details,
    # so if creation fails, this test will raise error; we assume it exists.
    # Otherwise, one would use a pre-existing vehicle known to have trips.
    try:
        vehicle_id = create_vehicle(auth_token)

        # Attempt to delete the vehicle
        url_vehicle = f"{VEHICLES_URL}/{vehicle_id}"
        resp_delete = requests.delete(url_vehicle, headers=headers, timeout=30)

        # Status code can be 200 (deleted or archived),
        # or 409 (conflict if vehicle in use and deletion denied)
        # Validate response accordingly
        assert resp_delete.status_code in (200, 409), (
            f"Expected status 200 or 409 for vehicle deletion, got {resp_delete.status_code}"
        )

        if resp_delete.status_code == 200:
            # Server returns JSON with keys: success (bool), archived (bool), tripsCount (number)
            json_data = resp_delete.json()
            assert "success" in json_data and isinstance(json_data["success"], bool), "Missing/invalid 'success' in response"
            assert "archived" in json_data and isinstance(json_data["archived"], bool), "Missing/invalid 'archived' in response"
            assert "tripsCount" in json_data and isinstance(json_data["tripsCount"], int), "Missing/invalid 'tripsCount' in response"
            # If tripsCount > 0 => archived should be True, else, vehicle deleted
            if json_data["tripsCount"] > 0:
                assert json_data["archived"], "Vehicle with tripsCount>0 should be archived"
            else:
                # Without trips, archived can be False (deleted)
                pass
        elif resp_delete.status_code == 409:
            # Conflict: vehicle in use and cannot delete
            # Response body expected per PRD? Possibly empty or error message
            pass

    finally:
        # Cleanup: attempt to delete the vehicle forcibly if still exists
        if vehicle_id:
            try:
                # Try delete without checking response to cleanup
                requests.delete(f"{VEHICLES_URL}/{vehicle_id}", headers=headers, timeout=30)
            except Exception:
                pass


test_vehicle_deletion_or_archival_with_trip_validation()