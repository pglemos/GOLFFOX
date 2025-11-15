import requests

BASE_URL = "http://localhost:3000"
CRON_DISPATCH_URL = f"{BASE_URL}/api/cron/dispatch-reports"
TIMEOUT = 30

VALID_CRON_SECRET = "test-cron-secret"

def test_cron_dispatch_reports():
    try:
        # Step 1: Test cron dispatch endpoint with valid CRON_SECRET in headers
        headers_valid = {
            "cronsecret": VALID_CRON_SECRET,
            "Content-Type": "application/json"
        }
        response_valid = requests.post(CRON_DISPATCH_URL, headers=headers_valid, timeout=TIMEOUT)
        assert response_valid.status_code == 200, (
            f"Expected 200 for valid cron secret, got {response_valid.status_code} with content: {response_valid.text}"
        )

        # Step 2: Test cron dispatch endpoint with invalid CRON_SECRET
        headers_invalid = {
            "cronsecret": "invalid-secret",
            "Content-Type": "application/json"
        }
        response_invalid = requests.post(CRON_DISPATCH_URL, headers=headers_invalid, timeout=TIMEOUT)
        assert response_invalid.status_code == 401, (
            f"Expected 401 for invalid cron secret, got {response_invalid.status_code} with content: {response_invalid.text}"
        )
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {str(e)}"

test_cron_dispatch_reports()
