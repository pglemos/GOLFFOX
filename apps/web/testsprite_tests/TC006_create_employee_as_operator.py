import requests
from requests.auth import HTTPBasicAuth
import uuid
import random
import string

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def generate_random_email():
    return f"test_employee_{uuid.uuid4().hex[:8]}@example.com"

def generate_random_string(length=8):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(length))

def test_create_employee_as_operator():
    """Test /api/operator/create-employee POST endpoint with various cases."""
    # First, authenticate to get bearer token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": AUTH_USERNAME, "password": AUTH_PASSWORD}
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "Token not found in login response"
    except Exception as e:
        raise AssertionError(f"Authentication failed: {str(e)}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    endpoint = f"{BASE_URL}/api/operator/create-employee"

    # Record created user IDs to clean up if applicable - note: PRD does not specify delete employee API,
    # so cleanup may not be feasible here. We'll just create unique emails to avoid conflicts.

    # 1) Case: Create employee with valid data - expect 201 Created
    valid_email = generate_random_email()
    valid_payload = {
        "email": valid_email,
        "name": "Test Employee",
        "phone": "1234567890",
        "role": "passenger"
    }

    # Use try-finally if we had delete endpoint, but we don't have it, so just test creation safely.

    # Test create new employee
    resp = requests.post(endpoint, headers=headers, json=valid_payload, timeout=TIMEOUT)
    assert resp.status_code in (200,201), f"Unexpected status code for valid create: {resp.status_code} - {resp.text}"
    resp_data = resp.json()
    if resp.status_code == 201:
        assert resp_data.get("email") == valid_email, "Returned email mismatch"
        assert resp_data.get("created") is True, "Create flag missing or false in response"
        assert "userId" in resp_data, "userId missing in 201 response"
        assert resp_data.get("role") == "passenger" or resp_data.get("role") is None, "Role mismatch in response"
        # companyId can be None or string
        assert "companyId" in resp_data
    elif resp.status_code == 200:
        # Employee already exists case
        assert resp_data.get("email") == valid_email, "Email mismatch in 200 exist response"

    # 2) Case: Create employee that already exists - POST again with same email, expect 200
    resp2 = requests.post(endpoint, headers=headers, json=valid_payload, timeout=TIMEOUT)
    assert resp2.status_code == 200, f"Expected 200 for existing employee, got {resp2.status_code}"
    resp2_data = resp2.json()
    assert resp2_data.get("email") == valid_email

    # 3) Case: Create employee with invalid data - missing email (required)
    invalid_payload_1 = {
        "name": "Invalid User",
        "phone": "123456789",
        "role": "passenger"
    }
    resp = requests.post(endpoint, headers=headers, json=invalid_payload_1, timeout=TIMEOUT)
    assert resp.status_code == 400, f"Expected 400 for missing email, got {resp.status_code}"

    # 4) Case: Create employee with invalid data - invalid email format
    invalid_payload_2 = {
        "email": "invalid-email-format",
        "name": "Invalid Email User",
        "phone": "123456789",
        "role": "passenger"
    }
    resp = requests.post(endpoint, headers=headers, json=invalid_payload_2, timeout=TIMEOUT)
    assert resp.status_code == 400, f"Expected 400 for invalid email format, got {resp.status_code}"

    # 5) Case: Unauthorized access - no token provided
    unauthorized_payload = {
        "email": generate_random_email(),
        "name": "Unauthorized User",
        "phone": "9876543210",
        "role": "passenger"
    }
    resp = requests.post(endpoint, json=unauthorized_payload, timeout=TIMEOUT)
    assert resp.status_code == 401, f"Expected 401 Unauthorized without token, got {resp.status_code}"

    # 6) Simulate server error - Not possible to force server error from client;
    # but can test for graceful response if server returns 500
    # Here we simulate if the server returns 500 with invalid role maybe.
    invalid_role_payload = {
        "email": generate_random_email(),
        "name": "Test Invalid Role",
        "phone": "5555555555",
        "role": "invalidrole"
    }
    resp = requests.post(endpoint, headers=headers, json=invalid_role_payload, timeout=TIMEOUT)
    # According to PRD invalid data returns 400, so 500 unlikely unless server error
    assert resp.status_code in (400,500), f"Expected 400 or 500 for invalid role, got {resp.status_code}"

test_create_employee_as_operator()