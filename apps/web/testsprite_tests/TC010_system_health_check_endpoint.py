import requests
from requests.auth import HTTPBasicAuth

def test_system_health_check_endpoint():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/health"
    auth = HTTPBasicAuth("golffox@admin.com", "senha123")
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that the response contains required fields
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "status" in data, "'status' field not in response"
    assert "timestamp" in data, "'timestamp' field not in response"
    assert data["status"] == "ok", f"Expected status 'ok', got '{data['status']}'"
    # Validate timestamp is a non-empty string (ISO 8601 format string)
    timestamp = data["timestamp"]
    assert isinstance(timestamp, str) and len(timestamp) > 0, "Invalid or empty 'timestamp' value"

test_system_health_check_endpoint()