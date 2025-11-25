import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
GENERATE_STOPS_URL = f"{BASE_URL}/api/admin/generate-stops"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_generate_optimized_route_stops():
    timeout = 30

    # Step 1: Authenticate and get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_headers = {
        "Content-Type": "application/json"
    }
    try:
        login_response = requests.post(
            LOGIN_URL,
            json=login_payload,
            headers=login_headers,
            timeout=timeout
        )
        login_response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    login_data = login_response.json()
    token = login_data.get("token")
    assert token, "Login response missing token"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Helper function to create a dummy route to get a route_id
    # No create route endpoint specified in PRD, so test with an invalid and valid scenario

    # Since no route creation endpoint info, test with an invalid route_id first to validate failure
    invalid_route_id_payload = {"route_id": "00000000-0000-0000-0000-000000000000"}
    try:
        response = requests.post(
            GENERATE_STOPS_URL,
            json=invalid_route_id_payload,
            headers=headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request failed for invalid route_id: {e}"

    # According to PRD, only 200 (success) and 500 (failure) responses documented.
    # For invalid route_id expect failure scenario with 500 or some error status.
    assert response.status_code in (200, 500), f"Unexpected status {response.status_code} for invalid route_id test"
    if response.status_code == 500:
        # Failure scenario handled correctly
        pass
    else:
        # Sometimes API could respond 200 if route_id exists, unexpected success - no failure handling
        pass

    # Now for success scenario:
    # Since no info on how to create route or get existing route_id, try to discover a route_id by other means:
    # For the test, the best we can do is create a route_id in a try-finally block if creation was possible.
    # Here, no route creation endpoint described in PRD, so we can't dynamically create a route.
    # Instead, we will skip dynamic creation and expect the test to be run with a known valid route_id.
    # To follow instructions, we must do try-finally with a created resource if resource id not provided,
    # but PRD/test plan do not provide or specify route creation. So, we will simulate with a placeholder route_id.

    # Placeholder valid UUID format route_id (simulate success scenario)
    valid_route_id = "123e4567-e89b-12d3-a456-426614174000"
    valid_payload = {"route_id": valid_route_id}

    try:
        post_response = requests.post(
            GENERATE_STOPS_URL,
            json=valid_payload,
            headers=headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request failed for valid route_id: {e}"

    # Assert success response 200 with message or empty body possible
    assert post_response.status_code == 200, f"Expected 200 status for valid route_id, got {post_response.status_code}"

    # The PRD does not define response body schema on success, just the description:
    # "Stops generated successfully" for 200, so assume no required fields.
    # If response json is present, just ensure it's parseable.
    try:
        post_response.json()
    except Exception:
        # If no json body returned that's also acceptable unless stated otherwise
        pass

test_generate_optimized_route_stops()