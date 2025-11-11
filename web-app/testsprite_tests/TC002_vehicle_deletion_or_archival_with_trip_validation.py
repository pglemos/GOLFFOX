import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
VEHICLE_ENDPOINT = f"{BASE_URL}/api/admin/vehicles"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

TIMEOUT = 30

def test_vehicle_deletion_or_archival_with_trip_validation():
    session = requests.Session()
    
    # Authenticate and get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_resp = session.post(LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
    login_data = login_resp.json()
    token = login_data.get("token")
    assert token and isinstance(token, str), "Token missing or invalid in login response"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Helper function to create a test vehicle
    def create_test_vehicle():
        # For vehicle creation, there is no direct endpoint in PRD, so using POST /api/admin/vehicles assumed
        create_url = f"{BASE_URL}/api/admin/vehicles"
        # Minimal valid payload - assuming at least 'plate' and 'model' needed, using dummy
        payload = {
            "plate": f"TEST-{uuid.uuid4().hex[:6].upper()}",
            "model": "TestModel 2025",
            "brand": "TestBrand",
            "year": 2025,
            "capacity": 40
        }
        resp = session.post(create_url, json=payload, headers=headers, timeout=TIMEOUT)
        if resp.status_code != 201:
            raise Exception(f"Failed to create test vehicle: {resp.status_code} {resp.text}")
        return resp.json().get("id") or resp.json().get("vehicleId")
    
    # Helper function to delete a vehicle by ID without validation, for cleanup
    def delete_vehicle(vehicle_id):
        del_url = f"{VEHICLE_ENDPOINT}/{vehicle_id}"
        session.delete(del_url, headers=headers, timeout=TIMEOUT)
    
    vehicle_id = None
    
    try:
        # Step 1: Create a vehicle to test deletion
        vehicle_id = create_test_vehicle()
        assert vehicle_id is not None, "Vehicle ID not returned after creation"
        
        delete_url = f"{VEHICLE_ENDPOINT}/{vehicle_id}"
        
        # Step 2: Attempt to delete vehicle - expect success with no trips
        del_resp = session.delete(delete_url, headers=headers, timeout=TIMEOUT)
        assert del_resp.status_code == 200, f"Failed to delete vehicle, status code {del_resp.status_code}"
        del_data = del_resp.json()
        assert isinstance(del_data.get("success"), bool), "Missing success flag in delete response"
        assert "archived" in del_data, "Missing archived flag in delete response"
        assert isinstance(del_data.get("tripsCount"), int), "Missing tripsCount in delete response"
        # vehicle had no trips, so archived likely False and success True
        assert del_data["success"] is True
        
        # Step 3: Validate invalid vehicle ID returns 400
        invalid_vehicle_id = "invalid-uuid-string"
        invalid_url = f"{VEHICLE_ENDPOINT}/{invalid_vehicle_id}"
        resp_invalid = session.delete(invalid_url, headers=headers, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid vehicleId, got {resp_invalid.status_code}"
        
        # Step 4: Test conflict scenario with a vehicle that has trips
        # For that, create another vehicle then simulate trips association or reuse if API supports
        # Since PRD does not define trips creation, try to reuse same vehicle and forcibly simulate
        
        # Create vehicle for conflict test
        conflict_vehicle_id = create_test_vehicle()
        assert conflict_vehicle_id is not None
        
        # Assuming there's an API or method to associate trips, but none provided in PRD.
        # We simulate conflict scenario by calling DELETE and expect either archived=True if trips exist or 409 if vehicle in use
        
        conflict_url = f"{VEHICLE_ENDPOINT}/{conflict_vehicle_id}"
        
        # We will mock this by calling DELETE twice:
        # First delete (no trips) may succeed, so recreate then forcibly call DELETE again for conflict
        
        # Delete first time to ensure no trips - should succeed or archive false
        resp_first_del = session.delete(conflict_url, headers=headers, timeout=TIMEOUT)
        assert resp_first_del.status_code == 200, "Expected successful delete/archival on first call"
        
        # Recreate vehicle to simulate vehicle with trips (since no trips creation API)
        conflict_vehicle_id = create_test_vehicle()
        conflict_url = f"{VEHICLE_ENDPOINT}/{conflict_vehicle_id}"
        
        # Simulate vehicle with trips by attempting delete and expecting 409 or archived True
        # Since API might respond 409 or 200 with archived True and tripsCount > 0 depending on behavior
        
        resp_conflict = session.delete(conflict_url, headers=headers, timeout=TIMEOUT)
        assert resp_conflict.status_code in (200, 409), f"Expected 200 or 409, got {resp_conflict.status_code}"
        if resp_conflict.status_code == 200:
            data = resp_conflict.json()
            assert data.get("archived") is True, "Vehicle with trips should be archived"
            assert data.get("tripsCount", 0) > 0, "Vehicle tripsCount should be greater than 0 on archival"
        elif resp_conflict.status_code == 409:
            # Conflict error response
            pass
        
    finally:
        # Cleanup - delete vehicles if exist
        if vehicle_id:
            try:
                delete_vehicle(vehicle_id)
            except Exception:
                pass
        if 'conflict_vehicle_id' in locals() and conflict_vehicle_id:
            try:
                delete_vehicle(conflict_vehicle_id)
            except Exception:
                pass

test_vehicle_deletion_or_archival_with_trip_validation()