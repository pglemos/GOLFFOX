import requests

BASE_URL = "http://localhost:3000"
CRON_DISPATCH_ENDPOINT = "/api/cron/dispatch-reports"
TIMEOUT = 30


def test_cron_dispatch_reports():
    # Test with invalid cronSecret header (expect 401)
    invalid_headers = {
        "x-cron-secret": "invalidsecret"
    }
    try:
        response_invalid = requests.post(
            BASE_URL + CRON_DISPATCH_ENDPOINT,
            headers=invalid_headers,
            timeout=TIMEOUT
        )
        assert response_invalid.status_code == 401, f"Expected 401 for invalid cronSecret, got {response_invalid.status_code}"
    except requests.RequestException as e:
        assert False, f"Request with invalid cronSecret failed: {e}"

    # Test without cronSecret header (expect 401)
    try:
        response_no_secret = requests.post(
            BASE_URL + CRON_DISPATCH_ENDPOINT,
            timeout=TIMEOUT
        )
        assert response_no_secret.status_code == 401, f"Expected 401 without cronSecret, got {response_no_secret.status_code}"
    except requests.RequestException as e:
        assert False, f"Request without cronSecret failed: {e}"

    # Test with a placeholder valid cronSecret header (expect 200)
    valid_cron_secret = "validsecret"  # Replace with actual secret if known
    valid_headers = {
        "x-cron-secret": valid_cron_secret
    }
    try:
        response_valid = requests.post(
            BASE_URL + CRON_DISPATCH_ENDPOINT,
            headers=valid_headers,
            timeout=TIMEOUT
        )
        assert response_valid.status_code == 200, f"Expected 200 for valid cronSecret, got {response_valid.status_code}"
        json_resp = response_valid.json()
        # We expect a success message or indication of dispatch success
        assert isinstance(json_resp, dict), "Response should be a JSON object"
    except requests.RequestException as e:
        assert False, f"Request with valid cronSecret failed: {e}"
    except ValueError:
        assert False, "Response is not valid JSON"


test_cron_dispatch_reports()
