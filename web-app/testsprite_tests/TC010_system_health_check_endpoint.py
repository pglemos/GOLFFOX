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
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"Request failed: {e}")

    try:
        data = response.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    # Validate status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response structure and content
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "status" in data, "Missing 'status' field in response"
    assert data["status"] == "ok", f"Expected status 'ok', got {data['status']}"
    assert "timestamp" in data, "Missing 'timestamp' field in response"
    assert isinstance(data["timestamp"], str), "'timestamp' field is not a string"
    assert len(data["timestamp"]) > 0, "'timestamp' field is empty"

test_system_health_check_endpoint()