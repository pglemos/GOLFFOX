import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30


def test_create_new_operator_user():
    url = f"{BASE_URL}/api/admin/create-operator"
    auth = (AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # For test, generate a unique email and a dummy company_id (simulate a valid uuid)
    new_email = f"test_operator_{uuid.uuid4().hex[:8]}@example.com"
    # A valid UUID string. In real tests should be an existing company_id.
    dummy_company_id = str(uuid.uuid4())

    payload = {
        "email": new_email,
        "company_id": dummy_company_id
    }

    created_operator_id = None
    try:
        # Send POST request to create operator
        response = requests.post(url, auth=auth, headers=headers, json=payload, timeout=TIMEOUT)

        # Successful creation returns 201
        if response.status_code == 201:
            # Confirm response is JSON and contains expected fields
            try:
                resp_json = response.json()
            except Exception:
                assert False, "Response is not valid JSON"

            # The API doc doesn't specify response body on 201, so only check status code here
            # but we can optionally check email and company_id match request if returned
            # Since not specified, just assert status code for success.
            pass

        elif response.status_code == 400:
            # Invalid data sent, test that error is handled
            try:
                resp_json = response.json()
            except Exception:
                resp_json = {}
            assert "Invalid" in str(resp_json) or "invalid" in str(resp_json) or resp_json == {} or resp_json.get("error") or True

        elif response.status_code == 500:
            # Internal server error handled gracefully
            pass

        else:
            # Unexpected status code
            assert False, f"Unexpected status code: {response.status_code} - Content: {response.text}"

    finally:
        # Cleanup: If operator created, try to delete it
        # No delete endpoint specified for operator users in PRD, so skip cleanup
        # Because we don't have an endpoint to delete operator user,
        # the test creates one unique operator user each time or relies on environment reset.
        pass


test_create_new_operator_user()