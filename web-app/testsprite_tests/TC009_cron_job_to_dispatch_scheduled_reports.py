import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CRON_DISPATCH_URL = f"{BASE_URL}/api/cron/dispatch-reports"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_cron_dispatch_reports():
    # Authenticate to get a token
    try:
        login_response = requests.post(
            LOGIN_URL,
            json={"email": USERNAME, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, "Login failed"
        login_data = login_response.json()
        token = login_data.get("token")
        assert token, "Token not found in login response"
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Test: invalid CRON_SECRET
    invalid_headers = headers.copy()
    invalid_headers["x-cron-secret"] = "invalid_secret"
    try:
        invalid_response = requests.post(
            CRON_DISPATCH_URL,
            headers=invalid_headers,
            timeout=TIMEOUT
        )
        assert invalid_response.status_code == 401, (
            f"Expected 401 for invalid CRON_SECRET, got {invalid_response.status_code} with body: {invalid_response.text}"
        )
    except Exception as e:
        raise AssertionError(f"Invalid secret dispatch request failed: {e}")

    # Note: Skipping valid CRON_SECRET test because real secret is unknown


test_cron_dispatch_reports()
