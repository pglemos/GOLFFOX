import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30


def test_generate_optimized_route_stops():
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    # Use a valid UUID string for testing since route creation endpoint is not defined in PRD
    valid_route_id = "123e4567-e89b-12d3-a456-426614174000"

    url = f"{BASE_URL}/api/admin/generate-stops"
    headers = {"Content-Type": "application/json"}

    # Test success case
    payload = {"route_id": valid_route_id}
    response = requests.post(url, json=payload, auth=auth, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    try:
        resp_json = response.json()
    except Exception:
        resp_json = None
    if resp_json:
        assert "error" not in resp_json, "Response contains error field."

    # Test failure case: Provide invalid route_id
    invalid_payload = {"route_id": "00000000-0000-0000-0000-000000000000"}
    response_fail = requests.post(url, json=invalid_payload, auth=auth, headers=headers, timeout=TIMEOUT)
    assert response_fail.status_code in {400, 500}, f"Expected 400 or 500 error, got {response_fail.status_code}"

    # Test failure case: Missing route_id (empty body)
    response_missing = requests.post(url, json={}, auth=auth, headers=headers, timeout=TIMEOUT)
    assert response_missing.status_code in {400, 500}, f"Expected 400 or 500 error due to missing route_id, got {response_missing.status_code}"

    # Test failure case: Invalid payload type
    response_invalid = requests.post(url, json={"route_id": 12345}, auth=auth, headers=headers, timeout=TIMEOUT)
    assert response_invalid.status_code in {400, 500}, f"Expected 400 or 500 error due to invalid route_id type, got {response_invalid.status_code}"


test_generate_optimized_route_stops()
