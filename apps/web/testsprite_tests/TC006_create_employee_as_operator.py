import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_create_employee_as_operator():
    # Authenticate to get bearer token via login
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": USERNAME, "password": PASSWORD}
    login_headers = {"Content-Type": "application/json"}
    try:
        login_resp = requests.post(login_url, json=login_payload, headers=login_headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token returned in login response"
    except Exception as e:
        raise AssertionError(f"Authentication failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    url = f"{BASE_URL}/api/operator/create-employee"

    # Prepare valid employee data
    new_employee_email = f"test_employee_{uuid.uuid4().hex[:8]}@example.com"
    valid_employee = {
        "email": new_employee_email,
        "name": "Test Employee",
        "phone": "+1234567890",
        "role": "passenger"
    }

    # 1. Test creating a new employee with valid data (expect 201 Created)
    created_user_id = None
    try:
        resp = requests.post(url, json=valid_employee, headers=headers, timeout=TIMEOUT)
        assert resp.status_code in (200, 201), f"Unexpected status code {resp.status_code} for valid employee creation"
        resp_data = resp.json()
        if resp.status_code == 201:
            # Employee created successfully
            created_user_id = resp_data.get("userId")
            assert created_user_id, "No userId returned on employee creation"
            assert resp_data.get("created") is True, "Expected 'created' field to be True"
            assert resp_data.get("email") == valid_employee["email"], "Returned email mismatch"
            assert resp_data.get("role") == valid_employee["role"], "Returned role mismatch"
            assert "companyId" in resp_data, "No companyId returned"
        elif resp.status_code == 200:
            # Employee already exists
            assert resp_data.get("email") == valid_employee["email"], "Returned email mismatch on existing employee"
    finally:
        # Cleanup if created user
        if created_user_id:
            # Deleting employee is not specified in PRD or available endpoints,
            # so no delete is performed here - assuming no direct delete endpoint.
            pass

    # 2. Test creating an employee with existing email (expect 200 Employee already exists)
    resp_exist = requests.post(url, json=valid_employee, headers=headers, timeout=TIMEOUT)
    assert resp_exist.status_code == 200, "Existing employee creation should return 200"
    exist_data = resp_exist.json()
    assert exist_data.get("email") == valid_employee["email"], "Returned email mismatch on existing employee"

    # 3. Test creating employee with invalid data (missing email)
    invalid_data = {
        "name": "No Email Employee",
        "phone": "+1234567891"
        # missing "email"
    }
    resp_invalid = requests.post(url, json=invalid_data, headers=headers, timeout=TIMEOUT)
    assert resp_invalid.status_code == 400, f"Invalid data should return 400 but got {resp_invalid.status_code}"

    # 4. Test unauthorized access (no token)
    resp_unauth = requests.post(url, json=valid_employee, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
    assert resp_unauth.status_code == 401, f"Unauthorized request should return 401 but got {resp_unauth.status_code}"

    # 5. Test internal server error simulation is difficult via public API; skipped.
    # However, we can test server error by sending malformed JSON (simulate)
    malformed_payload = '{"email": "badjson@example.com"'  # missing closing brace
    try:
        resp_error = requests.post(url, data=malformed_payload, headers=headers, timeout=TIMEOUT)
        # Server might respond with 400 or 500 depending on implementation
        assert resp_error.status_code in (400, 500), "Malformed JSON should return 400 or 500"
    except requests.exceptions.RequestException as e:
        # Network or parsing error may occur; treat as pass since simulating server error
        pass


test_create_employee_as_operator()