import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime

def test_system_health_check_endpoint():
    base_url = "http://localhost:3000"
    endpoint = f"{base_url}/api/health"
    auth = HTTPBasicAuth("golffox@admin.com", "senha123")
    headers = {
        "Accept": "application/json"
    }
    timeout = 30

    try:
        response = requests.get(endpoint, headers=headers, auth=auth, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {endpoint} failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response keys and types
    assert "status" in data, "Response JSON missing 'status' key"
    assert "timestamp" in data, "Response JSON missing 'timestamp' key"

    assert isinstance(data["status"], str), "'status' should be a string"
    assert data["status"].lower() == "ok", f"Expected status 'ok', got '{data['status']}'"

    # Validate timestamp format (ISO 8601 / RFC 3339)
    timestamp = data["timestamp"]
    assert isinstance(timestamp, str), "'timestamp' should be a string"
    try:
        # This will raise ValueError if the format is incorrect
        datetime.fromisoformat(timestamp.replace("Z","+00:00"))
    except ValueError:
        assert False, f"'timestamp' is not a valid ISO 8601 datetime string: {timestamp}"

test_system_health_check_endpoint()