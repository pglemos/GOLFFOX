import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_create_employee_as_operator():
    session = requests.Session()
    session.auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    session.headers.update({"Content-Type": "application/json"})

    endpoint = f"{BASE_URL}/api/operator/create-employee"

    # Helper function to attempt employee creation
    def create_employee(payload):
        try:
            response = session.post(endpoint, json=payload, timeout=TIMEOUT)
            return response
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

    # Generate unique email for new employee to avoid conflicts
    unique_email = f"test.employee.{uuid.uuid4()}@example.com"

    # 1. Test creating a new employee with valid data (should create with 201)
    valid_payload = {
        "email": unique_email,
        "name": "Test Employee",
        "phone": "1234567890",
        "role": "passenger"
    }
    created_user_id = None
    try:
        response = create_employee(valid_payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_resp = response.json()
        assert json_resp.get("created") is True
        assert json_resp.get("email") == unique_email
        assert json_resp.get("role") == "passenger"
        assert "userId" in json_resp
        created_user_id = json_resp["userId"]
        assert isinstance(created_user_id, str) and len(created_user_id) > 0

        # 2. Test creating the same employee again (should return 200 - employee exists)
        response_duplicate = create_employee(valid_payload)
        assert response_duplicate.status_code == 200
        # No specific schema detailed for this, but at least check no error
        resp_json_dup = response_duplicate.json() if response_duplicate.content else {}
        # Employee already exists case: check at minimum response status
        # resp_json_dup may be empty or contain indication of exists

        # 3. Test creating employee with invalid data (missing email)
        invalid_payload = {
            "name": "No Email User",
            "phone": "0000000000",
            "role": "passenger"
        }
        response_invalid = create_employee(invalid_payload)
        assert response_invalid.status_code == 400

        # 4. Test unauthorized access (no auth)
        unauthorized_response = requests.post(endpoint, json=valid_payload, timeout=TIMEOUT)
        assert unauthorized_response.status_code == 401

        # 5. Test server error simulation (not directly triggerable here, but test server error handling)
        # We try sending invalid JSON to simulate server error or bad request causing 500
        # Since invalid data already yields 400, to simulate 500 is not feasible without server control.

    finally:
        # Attempt to delete the created employee if possible - no delete endpoint documented,
        # so skipping deletion. In real scenario, would add cleanup code here.
        pass

test_create_employee_as_operator()