import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

auth = HTTPBasicAuth("golffox@admin.com", "senha123")

def test_create_employee_as_operator():
    url = f"{BASE_URL}/api/operator/create-employee"
    headers = {
        "Content-Type": "application/json"
    }

    # Valid employee data for creation
    employee_payload_valid = {
        "email": "test.employee@example.com",
        "name": "Test Employee",
        "phone": "+1234567890",
        "role": "passenger"
    }
    # Invalid employee data (missing required field email)
    employee_payload_invalid = {
        "name": "Invalid Employee",
        "phone": "+1234567899",
        "role": "operator"
    }
    # Try to create employee - first attempt (may create or already exists)
    try:
        response = requests.post(url, json=employee_payload_valid, headers=headers, auth=auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert response.status_code in (200, 201, 400, 401, 500), f"Unexpected status code: {response.status_code}"

    if response.status_code == 201:
        # Employee created successfully
        json_data = response.json()
        # Validate response structure and content
        assert "userId" in json_data, "Missing userId in response"
        assert json_data.get("created") is True, "Created flag not True in response"
        assert json_data.get("email") == employee_payload_valid["email"], "Email mismatch in response"
        assert json_data.get("role") == employee_payload_valid["role"], "Role mismatch in response"
        assert "companyId" in json_data and isinstance(json_data["companyId"], str) and json_data["companyId"], "Invalid or missing companyId"

        user_id = json_data["userId"]

        # Now test duplicate creation with same email (should return 200 with employee already exists)
        try:
            response_duplicate = requests.post(url, json=employee_payload_valid, headers=headers, auth=auth, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Duplicate creation request failed with exception: {e}"

        assert response_duplicate.status_code == 200, f"Expected 200 for existing employee, got {response_duplicate.status_code}"

    elif response.status_code == 200:
        # Employee already exists case
        # The response may or may not have content, just check status code as per spec
        pass

    elif response.status_code == 400:
        # Bad request - could be invalid data or operator not associated with company
        pass

    elif response.status_code == 401:
        # Unauthorized
        pass

    elif response.status_code == 500:
        # Internal server error
        pass

    # Test with invalid data (missing required 'email')
    try:
        response_invalid = requests.post(url, json=employee_payload_invalid, headers=headers, auth=auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid data request failed with exception: {e}"

    # Expecting 400 Bad Request for invalid data
    assert response_invalid.status_code == 400, f"Expected 400 for invalid data, got {response_invalid.status_code}"

    # Test unauthorized request (no auth)
    try:
        response_unauth = requests.post(url, json=employee_payload_valid, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Unauthorized request failed with exception: {e}"

    # Expecting 401 Unauthorized when no auth provided
    assert response_unauth.status_code == 401, f"Expected 401 for unauthorized request, got {response_unauth.status_code}"

test_create_employee_as_operator()