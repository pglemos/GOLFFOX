import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
CREATE_OPERATOR_ENDPOINT = "/api/admin/create-operator"
DELETE_OPERATOR_ENDPOINT_TEMPLATE = "/api/admin/operators/{operator_id}"

AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"


def test_create_new_operator_user():
    # Generate unique test email and a dummy UUID for company_id for testing
    test_email = f"test-operator-{uuid.uuid4()}@example.com"
    test_company_id = str(uuid.uuid4())

    url = BASE_URL + CREATE_OPERATOR_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": test_email,
        "company_id": test_company_id
    }

    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    operator_id = None

    # Create operator with valid data
    try:
        response = requests.post(url, json=payload, headers=headers, auth=auth, timeout=30)
        # Status code 201 means created successfully
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        response_json = response.json()
        # Validate response includes operator info (assumed response structure)
        # At minimum we expect the created operator's ID or some identifier in response.
        assert isinstance(response_json, dict), "Response JSON is not a dictionary"
        # We expect operator id or similar key, but since PRD does not specify response body,
        # We'll check email and company_id is returned or infer id from location header if exists.
        # For safety, try to extract operator_id from response if present:
        operator_id = response_json.get("id") or response_json.get("operator_id") or response_json.get("userId")
        if operator_id is None:
            # No id in response, try from Location header
            location = response.headers.get("Location")
            if location and location.startswith(CREATE_OPERATOR_ENDPOINT):
                operator_id = location.split("/")[-1]
        # operator_id may be None if not returned, so no assertion here
        # Also confirm email and company_id match in response if present
        if "email" in response_json:
            assert response_json["email"] == test_email
        if "company_id" in response_json:
            assert response_json["company_id"] == test_company_id

        # Test invalid data (missing email)
        invalid_payload = {
            "company_id": test_company_id
        }
        resp_invalid = requests.post(url, json=invalid_payload, headers=headers, auth=auth, timeout=30)
        assert resp_invalid.status_code == 400, f"Expected 400 for missing email, got {resp_invalid.status_code}"

        # Test invalid data (invalid email format)
        invalid_email_payload = {
            "email": "invalid-email-format",
            "company_id": test_company_id
        }
        resp_invalid_email = requests.post(url, json=invalid_email_payload, headers=headers, auth=auth, timeout=30)
        assert resp_invalid_email.status_code == 400, f"Expected 400 for invalid email format, got {resp_invalid_email.status_code}"

    finally:
        # Clean up: delete the created operator if operator_id is available
        if operator_id:
            try:
                delete_url = BASE_URL + DELETE_OPERATOR_ENDPOINT_TEMPLATE.format(operator_id=operator_id)
                del_resp = requests.delete(delete_url, auth=auth, timeout=30)
                # Accept 200 or 204 as success for deletion
                assert del_resp.status_code in (200, 204), f"Failed to delete operator with id {operator_id}"
            except Exception:
                pass


test_create_new_operator_user()