import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
CREATE_EMPLOYEE_ENDPOINT = "/api/operator/create-employee"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_create_employee_as_operator():
    session = requests.Session()

    # Step 1: Login to get Bearer Token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_headers = {
        "Content-Type": "application/json"
    }
    try:
        login_resp = session.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            headers=login_headers,
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token received after login"
    except requests.RequestException as e:
        assert False, f"Login request exception: {e}"

    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Test data for employee creation
    # We'll do multiple tests: valid creation, existing employee, invalid data, unauthorized access

    # 1. Valid creation test (create a unique employee)
    import uuid
    unique_email = f"test_employee_{uuid.uuid4().hex}@example.com"
    employee_payload = {
        "email": unique_email,
        "name": "Test Employee",
        "phone": "+5511999999999",
        "role": "passenger"
    }

    created_user_id = None
    try:
        resp = session.post(
            BASE_URL + CREATE_EMPLOYEE_ENDPOINT,
            json=employee_payload,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        # Either 201 created or 200 exists, both acceptable here
        assert resp.status_code in (200, 201), f"Unexpected status code: {resp.status_code} - {resp.text}"
        data = resp.json() if resp.content else {}
        # Validate response content fields on create
        if resp.status_code == 201:
            # New employee created
            created_user_id = data.get("userId")
            assert created_user_id, "userId missing in creation response"
            assert data.get("created") is True, "created flag not True for new employee"
            assert data.get("email") == unique_email
            assert data.get("role") == "passenger"
            assert "companyId" in data and data["companyId"], "Missing companyId"
        elif resp.status_code == 200:
            # Employee already exists
            # Check mandatory keys to satisfy contract
            assert "email" in data and data["email"] == unique_email
        else:
            assert False, "Unexpected status code for employee creation"
    except requests.RequestException as e:
        assert False, f"Request exception during valid employee creation: {e}"

    # 2. Duplicate creation - should return 200 (employee exists)
    try:
        resp_dup = session.post(
            BASE_URL + CREATE_EMPLOYEE_ENDPOINT,
            json=employee_payload,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert resp_dup.status_code == 200, f"Expected 200 for existing employee, got {resp_dup.status_code} - {resp_dup.text}"
    except requests.RequestException as e:
        assert False, f"Request exception during duplicate employee creation: {e}"

    # 3. Invalid data test - missing required email field
    invalid_payload = {
        "name": "No Email Employee",
        "phone": "+5511988888888",
        "role": "passenger"
    }
    try:
        resp_invalid = session.post(
            BASE_URL + CREATE_EMPLOYEE_ENDPOINT,
            json=invalid_payload,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        # Should respond with 400 for invalid data
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid data, got {resp_invalid.status_code} - {resp_invalid.text}"
    except requests.RequestException as e:
        assert False, f"Request exception during invalid employee creation: {e}"

    # 4. Unauthorized access test: no or invalid token
    try:
        resp_unauth = requests.post(
            BASE_URL + CREATE_EMPLOYEE_ENDPOINT,
            json=employee_payload,
            headers={"Content-Type": "application/json"},  # No auth header
            timeout=TIMEOUT,
        )
        assert resp_unauth.status_code == 401, f"Expected 401 Unauthorized without token, got {resp_unauth.status_code} - {resp_unauth.text}"
    except requests.RequestException as e:
        assert False, f"Request exception during unauthorized employee creation: {e}"

    # Cleanup: delete created employee if possible (no delete endpoint info, so skipping cleanup)
    # As PRD doesn't mention delete employee endpoint, leave created entity.

test_create_employee_as_operator()