import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CREATE_EMPLOYEE_URL = f"{BASE_URL}/api/operator/create-employee"
DELETE_USER_URL_TEMPLATE = f"{BASE_URL}/api/admin/users/{{user_id}}"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def login_and_get_token(username, password):
    payload = {"email": username, "password": password}
    try:
        resp = requests.post(LOGIN_URL, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        token = data.get("token")
        assert token, "Login response missing token"
        return token
    except requests.HTTPError as e:
        raise AssertionError(f"Login failed: {e}")

def create_employee(auth_token, employee_data):
    headers = {"Authorization": f"Bearer {auth_token}"}
    return requests.post(CREATE_EMPLOYEE_URL, json=employee_data, headers=headers, timeout=TIMEOUT)

def test_create_employee_as_operator():
    token = login_and_get_token(USERNAME, PASSWORD)
    headers = {"Authorization": f"Bearer {token}"}

    # Valid employee data
    employee_data = {
        "email": "test.employee@example.com",
        "name": "Test Employee",
        "phone": "+1234567890",
        "role": "passenger"
    }

    created_user_id = None
    try:
        # 1) Test successful creation (201) or existing employee (200)
        resp = create_employee(token, employee_data)
        assert resp.status_code in (200, 201), f"Unexpected status code for create employee: {resp.status_code}"
        resp_json = resp.json()
        if resp.status_code == 201:
            # Employee created
            created_user_id = resp_json.get("userId")
            assert created_user_id, "Created response missing userId"
            assert resp_json.get("email") == employee_data["email"]
            assert resp_json.get("role") == employee_data.get("role", "passenger")
            assert resp_json.get("created") is True
            assert "companyId" in resp_json and resp_json["companyId"]
        else:
            # Employee already exists
            # Response body schema not strictly specified for 200, so allow any content JSON
            pass

        # 2) Test invalid data (missing email)
        invalid_data = {
            "name": "Invalid User"
        }
        resp_invalid = create_employee(token, invalid_data)
        assert resp_invalid.status_code == 400, f"Expected 400 for invalid employee data, got {resp_invalid.status_code}"

        # 3) Test unauthorized access: no token
        resp_no_auth = requests.post(CREATE_EMPLOYEE_URL, json=employee_data, timeout=TIMEOUT)
        assert resp_no_auth.status_code == 401, f"Expected 401 Unauthorized when no token is provided, got {resp_no_auth.status_code}"

        # 4) Test invalid token
        headers_invalid = {"Authorization": "Bearer invalidtoken123"}
        resp_invalid_token = requests.post(CREATE_EMPLOYEE_URL, json=employee_data, headers=headers_invalid, timeout=TIMEOUT)
        # Could be 401 Unauthorized or 403 Forbidden depending on implementation
        assert resp_invalid_token.status_code in (401, 403), f"Expected 401/403 for invalid token, got {resp_invalid_token.status_code}"

        # 5) Test server error simulation is not specified but check 500 is handled gracefully
        # This requires special conditions on the server, so we skip actual 500 test

    finally:
        # Cleanup created employee if created
        if created_user_id:
            # Delete employee user via admin endpoint if available
            # The PRD does not list delete user endpoint, so we do nothing here
            # Alternatively, could issue DELETE if such API existed
            pass

test_create_employee_as_operator()