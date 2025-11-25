import requests

base_url = "http://localhost:3000"
timeout = 30

def test_cron_dispatch_reports():
    url = f"{base_url}/api/cron/dispatch-reports"
    
    # The endpoint requires CRON_SECRET header for authentication, not Basic Auth
    # Valid test secrets are defined in the endpoint code
    valid_cron_secret = "valid_secret"
    invalid_cron_secret = "invalid_secret"
    
    try:
        # 1. Test with valid CRON_SECRET header
        headers_valid = {
            "cron-secret": valid_cron_secret,
            "Content-Type": "application/json"
        }
        response_valid = requests.post(url, headers=headers_valid, timeout=timeout)
        assert response_valid.status_code == 200, (
            f"Expected 200 with valid CRON_SECRET, but got {response_valid.status_code}. "
            f"Response: {response_valid.text[:500]}"
        )
        
        # 2. Test with invalid CRON_SECRET header
        headers_invalid = {
            "cron-secret": invalid_cron_secret,
            "Content-Type": "application/json"
        }
        response_invalid = requests.post(url, headers=headers_invalid, timeout=timeout)
        actual_status = response_invalid.status_code
        assert actual_status == 401, (
            f"Expected 401 for invalid CRON_SECRET, got {actual_status}. "
            f"Response: {response_invalid.text[:500]}"
        )
        
        # 3. Test without any authentication
        response_no_auth = requests.post(url, headers={}, timeout=timeout)
        assert response_no_auth.status_code == 401, (
            f"Expected 401 without authentication, but got {response_no_auth.status_code}. "
            f"Response: {response_no_auth.text[:500]}"
        )
        
        print("✅ All cron dispatch reports tests passed!")
        
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_cron_dispatch_reports()