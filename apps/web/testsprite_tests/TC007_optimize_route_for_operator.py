import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_optimize_route_for_operator():
    url = f"{BASE_URL}/api/operator/optimize-route"
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(
            url,
            headers=headers,
            auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD),
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    # The PRD does not specify response body schema, but we can check json parse and some content
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Since no response schema specified, check for a success indication in response
    # Usually a message or data present
    assert isinstance(json_response, dict), "Response JSON is not a dictionary"
    # If there's a 'message' or 'status' field, verify it says success or similar
    msg = json_response.get("message") or json_response.get("status") or json_response.get("result")
    assert msg is None or ("success" in str(msg).lower() or "optimized" in str(msg).lower()), \
        "Response does not indicate successful route optimization"

test_optimize_route_for_operator()