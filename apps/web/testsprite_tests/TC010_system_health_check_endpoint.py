import requests
from requests.auth import HTTPBasicAuth

def test_system_health_check():
    base_url = "http://localhost:3000"
    endpoint = "/api/health"
    url = base_url + endpoint

    auth = HTTPBasicAuth("golffox@admin.com", "senha123")
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_data, dict), "Response JSON is not an object"
    assert "status" in json_data, "'status' field missing in response JSON"
    assert "timestamp" in json_data, "'timestamp' field missing in response JSON"

    assert isinstance(json_data["status"], str), "'status' field is not a string"
    assert json_data["status"].lower() == "ok", f"Expected status 'ok', got '{json_data['status']}'"

    assert isinstance(json_data["timestamp"], str), "'timestamp' field is not a string"
    # Optional: Validate timestamp format (ISO 8601)
    import re
    iso8601_pattern = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[\+\-]\d{2}:\d{2})$"
    assert re.match(iso8601_pattern, json_data["timestamp"]), f"Timestamp '{json_data['timestamp']}' is not in ISO 8601 format"

test_system_health_check()