import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
CRON_DISPATCH_ENDPOINT = "/api/cron/dispatch-reports"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"


def test_cron_dispatch_reports():
    # First, we do not know the valid CRON_SECRET, but the endpoint requires a header "cron-secret"
    # We will test two cases:
    # 1. Successful dispatch with a correct CRON_SECRET (simulate here with a placeholder "VALID_SECRET")
    # 2. Failure dispatch with an invalid CRON_SECRET

    session = requests.Session()
    session.auth = HTTPBasicAuth(USERNAME, PASSWORD)

    # Define headers and payload for valid and invalid cases
    valid_headers = {
        "cron-secret": "VALID_SECRET"
    }
    invalid_headers = {
        "cron-secret": "INVALID_SECRET"
    }

    # Test case 1: Valid CRON_SECRET - Expect 200 with success message
    try:
        response = session.post(
            BASE_URL + CRON_DISPATCH_ENDPOINT,
            headers=valid_headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # It's undefined what the response body content looks like on success,
        # but likely a message or success field
        try:
            json_resp = response.json()
            # If available, check presence of success indication
            if isinstance(json_resp, dict):
                assert (
                    "message" in json_resp or "success" in json_resp or "reports_dispatched" in json_resp
                ) or len(json_resp) == 0  # Accept empty json as well
        except Exception:
            # Accept if no JSON response
            pass

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Test case 2: Invalid CRON_SECRET - Expect 401 Unauthorized
    try:
        response = session.post(
            BASE_URL + CRON_DISPATCH_ENDPOINT,
            headers=invalid_headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 401, f"Expected 401 for invalid CRON_SECRET, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_cron_dispatch_reports()