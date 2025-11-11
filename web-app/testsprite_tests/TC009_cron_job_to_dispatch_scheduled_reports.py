import requests

BASE_URL = "http://localhost:3000"
CRON_DISPATCH_URL = f"{BASE_URL}/api/cron/dispatch-reports"
TIMEOUT = 30

VALID_CRON_SECRET = "valid-cron-secret"
INVALID_CRON_SECRET = "invalid-cron-secret"

def test_cron_job_dispatch_scheduled_reports():
    try:
        # Test valid cronSecret dispatch
        headers_valid = {
            "cronSecret": VALID_CRON_SECRET
        }
        resp_dispatch_valid = requests.post(CRON_DISPATCH_URL, headers=headers_valid, timeout=TIMEOUT)
        assert resp_dispatch_valid.status_code == 200, f"Expected 200 for valid cronSecret but got {resp_dispatch_valid.status_code}"

        # Test invalid cronSecret dispatch
        headers_invalid = {
            "cronSecret": INVALID_CRON_SECRET
        }
        resp_dispatch_invalid = requests.post(CRON_DISPATCH_URL, headers=headers_invalid, timeout=TIMEOUT)
        assert resp_dispatch_invalid.status_code == 401, f"Expected 401 for invalid cronSecret but got {resp_dispatch_invalid.status_code}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_cron_job_dispatch_scheduled_reports()
