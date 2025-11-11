import requests
from requests.auth import HTTPBasicAuth
import datetime

def test_system_health_check_endpoint():
    base_url = "http://localhost:3000"
    endpoint = "/api/health"
    url = base_url + endpoint
    auth = HTTPBasicAuth("golffox@admin.com", "senha123")
    headers = {
        "Accept": "application/json"
    }
    timeout = 30

    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response schema: object with "status" as string and "timestamp" as datetime string
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "status" in data, "'status' key missing in response"
    assert isinstance(data["status"], str), "'status' is not a string"
    # Optionally validate the expected value of status to be "ok"
    assert data["status"].lower() == "ok", f"Expected status 'ok', got '{data['status']}'"

    assert "timestamp" in data, "'timestamp' key missing in response"
    assert isinstance(data["timestamp"], str), "'timestamp' is not a string"
    # Validate timestamp format (ISO 8601)
    try:
        timestamp = datetime.datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
    except ValueError:
        assert False, f"Timestamp '{data['timestamp']}' is not valid ISO 8601 format"

test_system_health_check_endpoint()