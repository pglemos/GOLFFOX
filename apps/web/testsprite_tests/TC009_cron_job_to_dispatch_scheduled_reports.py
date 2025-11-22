import requests

BASE_URL = "http://localhost:3000"
CRON_DISPATCH_ENDPOINT = f"{BASE_URL}/api/cron/dispatch-reports"
TIMEOUT = 30


def test_cron_dispatch_reports():
    headers_valid = {
        "CRON_SECRET": "valid_cron_secret_placeholder"
    }
    headers_invalid = {
        "CRON_SECRET": "invalid_cron_secret"
    }

    # Attempt dispatch with valid CRON_SECRET header
    try:
        response = requests.post(
            CRON_DISPATCH_ENDPOINT,
            headers=headers_valid,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 for valid CRON_SECRET but got {response.status_code}"
        # Optionally check response content if specified
        try:
            json_data = response.json()
            assert isinstance(json_data, (dict, list)) or json_data is None
        except ValueError:
            pass
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Attempt dispatch with invalid CRON_SECRET header to trigger 401
    try:
        response = requests.post(
            CRON_DISPATCH_ENDPOINT,
            headers=headers_invalid,
            timeout=TIMEOUT
        )
        assert response.status_code == 401, f"Expected 401 for invalid CRON_SECRET but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"


test_cron_dispatch_reports()
