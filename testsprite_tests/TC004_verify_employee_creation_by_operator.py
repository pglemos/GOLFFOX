import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
CSRF_ENDPOINT = "/api/auth/csrf"
CREATE_EMPLOYEE_ENDPOINT = "/api/operator/create-employee"
DELETE_EMPLOYEE_ENDPOINT_TEMPLATE = "/api/operator/employees/{employee_id}"  # Assumed for cleanup

OPERATOR_EMAIL = "operator@example.com"
OPERATOR_PASSWORD = "operatorpassword"

def test_verify_employee_creation_by_operator():
    session = requests.Session()
    timeout = 30

    # 1. Log in as operator to get authentication token and session cookies
    login_payload = {
        "email": OPERATOR_EMAIL,
        "password": OPERATOR_PASSWORD
    }
    login_resp = session.post(f"{BASE_URL}{LOGIN_ENDPOINT}", json=login_payload, timeout=timeout)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert "token" in login_data, "No token received on login"
    token = login_data["token"]

    # 2. Get CSRF token for safe state-changing requests
    csrf_resp = session.get(f"{BASE_URL}{CSRF_ENDPOINT}", timeout=timeout)
    assert csrf_resp.status_code == 200, f"Failed to get CSRF token: {csrf_resp.text}"
    csrf_data = csrf_resp.json()
    assert "csrfToken" in csrf_data, "No csrfToken in response"
    csrf_token = csrf_data["csrfToken"]

    headers = {
        "Authorization": f"Bearer {token}",
        "X-CSRF-Token": csrf_token,
        "Content-Type": "application/json"
    }

    # Prepare valid employee payload
    valid_employee = {
        "email": "new.employee@example.com",
        "name": "New Employee",
        "phone": "555-1234",
        "role": "driver"
    }

    employee_id = None

    try:
        # 3. Test creating employee with valid data
        create_resp = session.post(
            f"{BASE_URL}{CREATE_EMPLOYEE_ENDPOINT}",
            json=valid_employee,
            headers=headers,
            timeout=timeout
        )
        assert create_resp.status_code == 201, f"Failed to create employee with valid data: {create_resp.text}"
        # We assume the response contains created employee info including ID
        created_employee = create_resp.json()
        assert "id" in created_employee or "employeeId" in created_employee, "No employee ID in create response"
        employee_id = created_employee.get("id") or created_employee.get("employeeId")

        # 4. Test creating employee with invalid data (missing required fields)
        invalid_employee_cases = [
            {},  # empty payload
            {"name": "Missing Email"},  # missing email
            {"email": "invalid-email-format", "name": "Invalid Email"},  # invalid email format
            {"email": "another@example.com"},  # missing name
            {"email": "valid@example.com", "name": "Valid", "role": "invalid_role"},  # invalid role
        ]

        for invalid_payload in invalid_employee_cases:
            resp = session.post(
                f"{BASE_URL}{CREATE_EMPLOYEE_ENDPOINT}",
                json=invalid_payload,
                headers=headers,
                timeout=timeout
            )
            assert resp.status_code == 400, f"Invalid data not rejected as expected for payload {invalid_payload}: {resp.text}"

    finally:
        # Cleanup: delete the employee if created
        if employee_id:
            # Assume DELETE endpoint exists for employees by operator
            delete_url = f"{BASE_URL}{DELETE_EMPLOYEE_ENDPOINT_TEMPLATE.format(employee_id=employee_id)}"
            del_resp = session.delete(delete_url, headers=headers, timeout=timeout)
            # Deletion might fail if endpoint or permissions restrict it, but we do not assert here to avoid test failures on cleanup.
            
test_verify_employee_creation_by_operator()