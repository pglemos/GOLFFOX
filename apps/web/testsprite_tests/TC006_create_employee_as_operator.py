import requests
import uuid

BASE_URL = "http://localhost:3000"
# Placeholder: A valid bearer token should be used here for the operator
BEARER_TOKEN = "Bearer your_valid_operator_token"
TIMEOUT = 30


def test_create_employee_as_operator():
    session = requests.Session()
    headers = {
        "Content-Type": "application/json",
        "Authorization": BEARER_TOKEN
    }
    url = f"{BASE_URL}/api/operator/create-employee"

    # Generate unique email for employee to avoid conflicts
    unique_email = f"test_employee_{uuid.uuid4()}@example.com"
    valid_payload = {
        "email": unique_email,
        "name": "Test Employee",
        "phone": "+5511999999999",
        "role": "passenger"
    }

    created_user_id = None

    try:
        # 1) Test creating a new employee with valid data (expect 201)
        response = session.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_resp = response.json()
        assert json_resp.get("email") == unique_email
        assert json_resp.get("created") is True
        created_user_id = json_resp.get("userId")
        assert created_user_id is not None and isinstance(created_user_id, str)

        # 2) Test creating the same employee again - employee already exists (expect 200 or 201)
        response_dup = session.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response_dup.status_code in (200, 201), f"Expected 200 or 201 for existing employee, got {response_dup.status_code}"

        # 3) Test with invalid data (missing required 'email') (expect 400)
        invalid_payload = {
            "name": "No Email Employee",
            "phone": "+5511888888888",
            "role": "passenger"
        }
        response_invalid = session.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response_invalid.status_code == 400, f"Expected 400 for invalid data, got {response_invalid.status_code}"

        # 4) Test unauthorized access - no bearer token (expect 401)
        unauthorized_resp = requests.post(url, json=valid_payload, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
        assert unauthorized_resp.status_code == 401, f"Expected 401 for unauthorized, got {unauthorized_resp.status_code}"

        # 5) Test server error handling by sending malformed JSON (simulate) - expecting server to respond with 500 or 400
        # Note: Since malformed JSON can't be sent via json= parameter, we send text with bad json
        bad_json_headers = {"Content-Type": "application/json", "Authorization": BEARER_TOKEN}
        bad_json_body = '{"email": "bad_json_test", "name": "bad json employee", '
        response_malformed = session.post(url, headers=bad_json_headers, data=bad_json_body, timeout=TIMEOUT)
        assert response_malformed.status_code in (400, 500), f"Expected 400 or 500 for malformed JSON, got {response_malformed.status_code}"

    finally:
        # Cleanup: if user was created, delete or deactivate if endpoint existed.
        # Since PRD doesn't specify employee delete, no delete endpoint is given;
        # So manual cleanup may be needed outside this test.
        pass


test_create_employee_as_operator()
