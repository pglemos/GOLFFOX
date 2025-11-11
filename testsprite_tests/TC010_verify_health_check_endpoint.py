import requests
from datetime import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_health_check_endpoint():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response keys
    for key in ["ok", "supabase", "ts"]:
        assert key in data, f"Response JSON missing key: {key}"

    # Validate 'ok' is boolean True
    assert isinstance(data["ok"], bool), "'ok' should be a boolean"
    assert data["ok"] is True, "'ok' should be True indicating application is healthy"

    # Validate 'supabase' is string and one of ['ok', 'error']
    assert data["supabase"] in ["ok", "error"], "'supabase' should be 'ok' or 'error'"

    # Validate 'ts' is a valid ISO 8601 datetime string
    ts = data["ts"]
    try:
        datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        assert False, "'ts' is not a valid ISO8601 datetime string"

test_verify_health_check_endpoint()