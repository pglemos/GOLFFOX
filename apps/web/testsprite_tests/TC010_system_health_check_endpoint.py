import requests
from requests.auth import HTTPBasicAuth

def test_system_health_check_endpoint():
    base_url = "http://localhost:3000"
    endpoint = "/api/health"
    url = base_url + endpoint
    auth = HTTPBasicAuth("golffox@admin.com", "senha123")
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to health endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_response, dict), "Response JSON is not an object"
    assert "status" in json_response, "Response JSON missing 'status' field"
    assert "timestamp" in json_response, "Response JSON missing 'timestamp' field"
    assert isinstance(json_response["status"], str), "'status' field is not a string"
    assert json_response["status"].lower() == "ok", f"Expected status 'ok', got '{json_response['status']}'"
    assert isinstance(json_response["timestamp"], str), "'timestamp' field is not a string"
    # Optionally, validate timestamp format (ISO8601)
    import datetime
    try:
        datetime.datetime.fromisoformat(json_response["timestamp"].replace("Z", "+00:00"))
    except ValueError:
        assert False, "timestamp field is not a valid ISO 8601 date-time string"

test_system_health_check_endpoint()