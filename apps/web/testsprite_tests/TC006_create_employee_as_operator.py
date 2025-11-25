import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_create_employee_as_operator():
    # Login to get Bearer token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    login_headers = {
        "Content-Type": "application/json"
    }
    try:
        login_resp = requests.post(login_url, json=login_payload, headers=login_headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "Token not found in login response"
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    employee_endpoint = f"{BASE_URL}/api/operator/create-employee"

    # Valid employee data (to create a new employee)
    import uuid
    new_email = f"test_employee_{uuid.uuid4().hex[:8]}@example.com"
    employee_data_valid = {
        "email": new_email,
        "name": "Test Employee",
        "phone": "+5511999999999",
        "role": "passenger"
    }

    created_user_id = None
    try:
        # 1. Create employee with valid data - expect 201 Created or 200 if already exists
        resp = requests.post(employee_endpoint, json=employee_data_valid, headers=headers, timeout=TIMEOUT)
        assert resp.status_code in (200, 201), f"Expected 200 or 201, got {resp.status_code}"
        resp_json = resp.json()
        if resp.status_code == 201:
            # Employee created
            created_user_id = resp_json.get("userId")
            assert created_user_id, "userId not returned on employee creation"
            assert resp_json.get("email") == new_email
            assert resp_json.get("role") == employee_data_valid["role"]
        elif resp.status_code == 200:
            # Employee already exists - response may include fields
            assert "userId" in resp_json or "email" in resp_json, "Response missing expected fields"

        # 2. Try to create employee with invalid data (missing required 'email')
        invalid_data = {
            "name": "No Email Employee",
            "phone": "+5511988888888"
        }
        resp_invalid = requests.post(employee_endpoint, json=invalid_data, headers=headers, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid data, got {resp_invalid.status_code}"

        # 3. Unauthorized access - no token header
        resp_unauth = requests.post(employee_endpoint, json=employee_data_valid, timeout=TIMEOUT)
        assert resp_unauth.status_code == 401, f"Expected 401 for unauthorized, got {resp_unauth.status_code}"

        # 4. Simulate a server error by sending malformed data type (e.g. integer instead of string for email)
        bad_data = {
            "email": 12345,  # invalid type
            "name": "Bad Email Type",
            "phone": "+5511977777777",
            "role": "passenger"
        }
        resp_server_error = requests.post(employee_endpoint, json=bad_data, headers=headers, timeout=TIMEOUT)
        # Server may return 400 or 500 depending on validation, accept either 400 or 500 as valid error response
        assert resp_server_error.status_code in (400, 500), f"Expected 400 or 500 for bad data, got {resp_server_error.status_code}"

    finally:
        # Cleanup: delete the created employee if created_user_id exists
        if created_user_id:
            try:
                delete_url = f"{BASE_URL}/api/admin/users/{created_user_id}"
                # Delete might require auth; reuse bearer token
                delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # Accept 200 or 204 for successful deletion; 404 if already deleted
                assert delete_resp.status_code in (200, 204, 404), f"Failed to delete created employee: {delete_resp.status_code}"
            except Exception:
                # If cleanup fails, do not raise to not mask test result
                pass

test_create_employee_as_operator()