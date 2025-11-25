import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_generate_optimized_route_stops():
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # Test success scenario: generate optimized stops with valid route_id
    url = f"{BASE_URL}/api/admin/generate-stops"
    valid_route_id = "11111111-1111-1111-1111-111111111111"  # Example valid UUID
    payload = {
        "route_id": valid_route_id
    }
    response = requests.post(url, json=payload, headers=headers, auth=auth, timeout=TIMEOUT)

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    # Test failure scenario: generate stops with invalid route_id
    invalid_payload = {
        "route_id": "00000000-0000-0000-0000-000000000000"  # Synthetic invalid UUID
    }
    response_fail = requests.post(url, json=invalid_payload, headers=headers, auth=auth, timeout=TIMEOUT)
    # The response should not be 200 for invalid route_id
    assert response_fail.status_code != 200, "Expected failure status code for invalid route_id"

test_generate_optimized_route_stops()
