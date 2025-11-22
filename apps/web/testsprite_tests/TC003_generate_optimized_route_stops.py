import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_generate_optimized_route_stops():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # We need a valid route_id. No direct info on route creation endpoint given.
    # We'll try to create a dummy route for testing or skip if not available.
    # Given no route creation API provided, we will simulate failure with invalid UUID first,
    # then try success case with a dummy valid UUID format.

    import uuid

    valid_route_id = str(uuid.uuid4())  # Generated UUID as dummy route_id for test
    invalid_route_id = "invalid-uuid-format"

    # Helper function to call generate stops endpoint
    def call_generate_stops(route_id):
        url = f"{BASE_URL}/api/admin/generate-stops"
        payload = {"route_id": route_id}
        try:
            response = requests.post(url, auth=auth, headers=headers, json=payload, timeout=TIMEOUT)
            return response
        except requests.RequestException as e:
            raise AssertionError(f"Request failed: {e}")

    # Test success scenario (assuming backend accepts any UUID and returns 200)
    response_success = call_generate_stops(valid_route_id)
    try:
        assert response_success.status_code == 200, f"Expected 200 OK but got {response_success.status_code} with body {response_success.text}"
    except AssertionError as e:
        # It's possible backend requires existing route id.
        # If 500 or other error received, fail test as generation should succeed for valid route_id
        raise e

    # Test failure scenario - invalid route_id format or server error handling
    response_failure = call_generate_stops(invalid_route_id)
    # The PRD specifies 500 for failure - we accept 4xx or 500 but not 200
    try:
        assert response_failure.status_code != 200, (
            f"Expected failure status but got 200 OK for invalid route_id, response body: {response_failure.text}"
        )
    except AssertionError as e:
        raise e

test_generate_optimized_route_stops()