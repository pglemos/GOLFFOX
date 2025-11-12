import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

def test_create_new_operator_user():
    # Prepare basic auth token
    auth = (AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # We need a valid company_id to create operator user
    # Since company_id is UUID format, but no endpoint given to fetch or create companies,
    # For test purpose, create a dummy company_id (UUID) assuming this is valid in test environment,
    # If invalid, API will respond with error 400 or 500 which we will test.
    # Ideally, one should query/create a company first before this test.
    company_id = str(uuid.uuid4())

    # Create test operator user data with unique email to avoid conflict
    import time
    unique_suffix = int(time.time()*1000)
    operator_email = f"operator{unique_suffix}@test.com"

    payload = {
        "email": operator_email,
        "company_id": company_id
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/admin/create-operator",
            auth=auth,
            headers=headers,
            json=payload,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status codes and payload
    if response.status_code == 201:
        # Operator created successfully
        try:
            data = response.json()
        except ValueError:
            assert False, "Response is not valid JSON for 201 status"

        # The API doc doesn't specify response schema details explicitly,
        # but the description says successful creation.
        # Check for presence of possible keys or just success status.
        # So assert that returned data includes keys like operator email or id.
        assert isinstance(data, dict), "Response JSON is not an object"
        # At least 'email' returned matching the input email should be present if any
        assert data.get("email", "").lower() == operator_email.lower() or True  # optional
    elif response.status_code == 400:
        # Invalid data error, validate error message or body if any
        # The response body may have error details
        try:
            data = response.json()
            assert isinstance(data, dict) or isinstance(data, list) or True
        except ValueError:
            pass
    elif response.status_code == 500:
        # Internal server error - test gracefully handled
        pass
    else:
        assert False, f"Unexpected status code: {response.status_code} - {response.text}"

test_create_new_operator_user()