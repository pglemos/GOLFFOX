import requests
from requests.auth import HTTPBasicAuth
import datetime

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_system_health_check_endpoint():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD), timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response structure
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "status" in data, "Missing 'status' field in response"
    assert "timestamp" in data, "Missing 'timestamp' field in response"
    assert data["status"] == "ok", f"Expected status 'ok' but got '{data['status']}'"

    # Validate timestamp field format
    timestamp = data["timestamp"]
    try:
        # This will raise ValueError if format invalid
        datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        assert False, "timestamp is not a valid ISO 8601 datetime string"

test_system_health_check_endpoint()