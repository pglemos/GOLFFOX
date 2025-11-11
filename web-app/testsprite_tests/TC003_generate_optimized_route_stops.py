import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

# Set a valid route_id manually here for testing purpose
VALID_ROUTE_ID = "00000000-0000-0000-0000-000000000000"  # Replace with actual existing route_id

def test_generate_optimized_route_stops():
    session = requests.Session()
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    url = f"{BASE_URL}/api/admin/generate-stops"
    headers = {
        "Content-Type": "application/json"
    }

    # 1. Test successful generation of optimized route stops with valid route_id
    assert VALID_ROUTE_ID != "00000000-0000-0000-0000-000000000000", "Set VALID_ROUTE_ID to an actual existing route UUID before running this test."

    payload = {"route_id": VALID_ROUTE_ID}
    response = session.post(url, json=payload, auth=auth, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"

    # 2. Test failure scenario with invalid route_id (malformed or non-existent)
    invalid_payloads = [
        {"route_id": "invalid-uuid"},
        {"route_id": str(uuid.uuid4())}  # random UUID likely not existing
    ]
    for invalid_payload in invalid_payloads:
        resp_fail = session.post(url, json=invalid_payload, auth=auth, headers=headers, timeout=TIMEOUT)
        # According to PRD, failure returns 500 status
        assert resp_fail.status_code == 500, \
            f"Expected 500 on failure but got {resp_fail.status_code} for payload {invalid_payload}"

    # 3. Test failure scenario with missing route_id field (empty JSON)
    resp_missing = session.post(url, json={}, auth=auth, headers=headers, timeout=TIMEOUT)
    # Possibly 400 or 500 error, accept 400 or 500 as failure indicator
    assert resp_missing.status_code in [400, 500], \
        f"Expected 400 or 500 for missing route_id, got {resp_missing.status_code}"


test_generate_optimized_route_stops()
