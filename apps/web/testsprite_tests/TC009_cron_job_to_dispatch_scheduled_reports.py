import requests
from requests.auth import HTTPBasicAuth

base_url = "http://localhost:3000"
auth = HTTPBasicAuth("golffox@admin.com", "senha123")
timeout = 30

def test_cron_dispatch_reports():
    url = f"{base_url}/api/cron/dispatch-reports"
    headers = {}

    # Attempt with valid authentication token via Basic Auth (as per instructions)
    # The spec says security is based on CRON_SECRET which the API expects, but no schema for that key given.
    # Following instructions: use Basic Auth token for authentication

    # Since the API doc says security is with cronSecret (likely header or query param),
    # but instructions say to use basic token auth => send basic auth and test from there.
    # We'll test both success (with valid auth) and error (invalid CRON_SECRET).

    # For success case, try with valid auth headers (basic auth):
    # We'll send a valid CRON_SECRET in header to simulate correct usage,
    # but since no exact key or value is given, we test with the Basic Auth only.

    try:
        # 1. Test successful dispatch with valid Basic Auth
        response = requests.post(url, auth=auth, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        # Response body may be empty or contain success message - just check status code presence

        # 2. Test invalid CRON_SECRET: simulate by sending wrong basic auth or no auth
        response_invalid = requests.post(url, headers={}, timeout=timeout)
        assert response_invalid.status_code == 401, f"Expected 401 Unauthorized but got {response_invalid.status_code}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_cron_dispatch_reports()