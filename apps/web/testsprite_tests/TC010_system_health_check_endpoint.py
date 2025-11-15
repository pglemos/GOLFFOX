import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime

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

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(data, dict), "Response JSON is not an object"

    assert "status" in data, "Response JSON missing 'status' key"
    assert isinstance(data["status"], str), "'status' should be a string"
    assert data["status"].lower() == "ok", f"Expected 'status' to be 'ok', got {data['status']}"

    assert "timestamp" in data, "Response JSON missing 'timestamp' key"
    assert isinstance(data["timestamp"], str), "'timestamp' should be a string"

    # Validate timestamp format (ISO 8601 date-time)
    try:
        datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
    except ValueError:
        assert False, f"Timestamp '{data['timestamp']}' is not a valid ISO 8601 date-time string"

test_system_health_check_endpoint()