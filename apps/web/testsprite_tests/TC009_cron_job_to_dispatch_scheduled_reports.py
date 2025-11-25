import requests
from requests.auth import HTTPBasicAuth

base_url = "http://localhost:3000"
auth = HTTPBasicAuth("golffox@admin.com", "senha123")
timeout = 30

def test_cron_dispatch_reports():
    url = f"{base_url}/api/cron/dispatch-reports"

    # Test case 1: Successful dispatch with valid CRON_SECRET header
    valid_headers = {
        "CRON_SECRET": "valid_secret_token"
    }
    try:
        response = requests.post(url, headers=valid_headers, auth=auth, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        # Optionally check some content or message in response json if available
    except requests.RequestException as e:
        assert False, f"Request failed unexpectedly: {e}"

    # Test case 2: Authentication failure with invalid CRON_SECRET header
    invalid_headers = {
        "CRON_SECRET": "invalid_secret_token"
    }
    try:
        response = requests.post(url, headers=invalid_headers, auth=auth, timeout=timeout)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed unexpectedly: {e}"

test_cron_dispatch_reports()