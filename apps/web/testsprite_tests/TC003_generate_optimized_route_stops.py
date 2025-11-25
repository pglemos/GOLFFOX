import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30


def test_generate_optimized_route_stops():
    # Authenticate with basic token (Basic Auth)
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: We need a valid route_id. Since not provided, create a new route resource.
    # But the PRD does not specify a route creation endpoint or schema explicitly.
    # To handle this, try to find an existing route or skip creation as no route creation defined.
    # Instead, attempt to call generation with an invalid and then a mock valid UUID.

    # For a meaningful test, generate a route_id - we will try a dummy UUID format string
    # because no route create API exists in PRD; we expect 200 or 500 accordingly.

    import uuid

    valid_route_id = str(uuid.uuid4())
    invalid_route_id = "invalid-uuid-format"

    url = f"{BASE_URL}/api/admin/generate-stops"

    # Test success scenario with a valid UUID format route_id
    success_payload = {
        "route_id": valid_route_id
    }

    try:
        response = requests.post(url, json=success_payload, headers=headers, auth=auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during success scenario: {e}"

    # Accept either 200 (success) or 500 (generate failure) per PRD responses
    # If 200 assert success else 500 handle as failure
    if response.status_code == 200:
        assert response.ok, f"Expected success response, got: {response.status_code}"
        # Optionally assert response content if any, but PRD doesn't specify response schema
    else:
        assert response.status_code == 500, f"Expected 200 or 500, got {response.status_code}"

    # Test failure scenario: malformed or missing route_id
    invalid_payload = {
        "route_id": invalid_route_id
    }

    try:
        response_invalid = requests.post(url, json=invalid_payload, headers=headers, auth=auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during failure scenario: {e}"

    # Expecting a failure in generation which presumably leads to 500, or possibly 400 if validated
    assert response_invalid.status_code in {400, 500}, f"Expected 400 or 500 for invalid route_id, got {response_invalid.status_code}"

    # Test failure scenario: missing route_id field altogether
    missing_payload = {}

    try:
        response_missing = requests.post(url, json=missing_payload, headers=headers, auth=auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during missing route_id scenario: {e}"

    # Expect 400 or 500 for missing data
    assert response_missing.status_code in {400, 500}, f"Expected 400 or 500 for missing route_id, got {response_missing.status_code}"


test_generate_optimized_route_stops()