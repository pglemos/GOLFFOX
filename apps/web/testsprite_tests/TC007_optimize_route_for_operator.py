import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_optimize_route_for_operator():
    url = f"{BASE_URL}/api/operator/optimize-route"
    try:
        response = requests.post(
            url,
            auth=HTTPBasicAuth(USERNAME, PASSWORD),
            timeout=TIMEOUT,
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response is not None, "No response received"
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    # Response described as success with no explicit body schema, check for JSON and expected keys if present
    try:
        json_data = response.json()
    except ValueError:
        json_data = None
    # If JSON returned, validate type
    if json_data is not None:
        assert isinstance(json_data, dict), "Response JSON is not a dictionary"

test_optimize_route_for_operator()