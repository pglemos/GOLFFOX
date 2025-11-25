import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
VEHICLE_URL_TEMPLATE = f"{BASE_URL}/api/admin/vehicles/{{vehicle_id}}"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

TIMEOUT = 30


def test_vehicle_deletion_or_archival_with_trip_validation():
    session = requests.Session()

    # Step 1: Login to get authentication token (basic token)
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "No token found in login response"
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Helper function to create a vehicle (simulate creation for test) to get a vehicleId
    # Because the PRD does not have vehicle creation doc, assume there is a post endpoint at /api/admin/vehicles
    # We will try to create a minimal vehicle for test purposes and then delete it after test
    # Vehicle creation schema is unknown so we will create a dummy vehicle with a unique plate number or name.
    new_vehicle_id = None
    try:
        create_vehicle_url = f"{BASE_URL}/api/admin/vehicles"
        vehicle_payload = {
            "plate": f"TEST-{uuid.uuid4().hex[:8]}",
            "model": "Test Model",
            "brand": "Test Brand",
            "year": 2020,
            "capacity": 40
        }
        create_resp = session.post(create_vehicle_url, json=vehicle_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code in (200, 201), f"Vehicle creation failed with status {create_resp.status_code}"
        vehicle_data = create_resp.json()
        new_vehicle_id = vehicle_data.get("id")
        assert new_vehicle_id, "Created vehicle ID not returned"

        # Step 2: Attempt to delete vehicle with invalid vehicleId (should return 400)
        invalid_vehicle_id = "invalid-uuid"
        del_invalid_resp = session.delete(VEHICLE_URL_TEMPLATE.format(vehicle_id=invalid_vehicle_id),
                                          headers=headers, timeout=TIMEOUT)
        assert del_invalid_resp.status_code == 400, f"Expected 400 on invalid vehicle ID, got {del_invalid_resp.status_code}"

        # Step 3: Delete the newly created vehicle (should succeed with 200 or archive if trips exist)
        del_resp = session.delete(VEHICLE_URL_TEMPLATE.format(vehicle_id=new_vehicle_id),
                                  headers=headers, timeout=TIMEOUT)
        assert del_resp.status_code == 200, f"Vehicle delete failed with status {del_resp.status_code}"

        del_json = del_resp.json()
        assert isinstance(del_json, dict), "Response is not a JSON object"
        assert "success" in del_json, "'success' key missing in response"
        assert isinstance(del_json["success"], bool), "'success' value not boolean"
        # archived may be true if vehicle has trips linked; can be false if vehicle deleted completely
        assert "archived" in del_json, "'archived' key missing in response"
        assert isinstance(del_json["archived"], bool), "'archived' value not boolean"
        # tripsCount indicates how many trips linked to vehicle
        assert "tripsCount" in del_json, "'tripsCount' key missing in response"
        assert isinstance(del_json["tripsCount"], int), "'tripsCount' value not integer"
        # If trips exist, vehicle shouldn't be fully deleted but archived (archived=True)
        if del_json["tripsCount"] > 0:
            assert del_json["archived"] is True, "Vehicle with trips must be archived, not deleted"
        else:
            # If no trips, archived may be false as vehicle deleted completely
            assert del_json["success"] is True, "Success should be True on successful deletion"

        # Step 4: Try delete a vehicle that is in use but simulate conflict by deleting twice
        # Attempting to delete again should return 409 if vehicle in use or does not exist
        del_again_resp = session.delete(VEHICLE_URL_TEMPLATE.format(vehicle_id=new_vehicle_id),
                                        headers=headers, timeout=TIMEOUT)

        # Expected 409 conflict or possibly 400 or 404 depending on implementation, we expect 409 on conflict per doc
        assert del_again_resp.status_code in (409, 400, 404), \
            f"Expected 409, 400 or 404 on deleting the same vehicle again, got {del_again_resp.status_code}"

    finally:
        # Cleanup: If vehicle still exists, try to delete without assertions to avoid test failure in cleanup
        if new_vehicle_id:
            try:
                session.delete(VEHICLE_URL_TEMPLATE.format(vehicle_id=new_vehicle_id), headers=headers, timeout=TIMEOUT)
            except Exception:
                pass


test_vehicle_deletion_or_archival_with_trip_validation()