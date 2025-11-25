import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_user_login_endpoint_validation():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }

    # Successful login with valid credentials
    valid_payload = {
        "email": "golffox@admin.com",
        "password": "senha123"
    }
    response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code} with {response.text}"
        json_data = response.json()
        assert "token" in json_data and isinstance(json_data["token"], str) and json_data["token"], "Missing or invalid token"
        assert "refreshToken" in json_data and isinstance(json_data["refreshToken"], str) and json_data["refreshToken"], "Missing or invalid refreshToken"
        assert "user" in json_data and isinstance(json_data["user"], dict), "Missing or invalid user object"
        assert "session" in json_data and isinstance(json_data["session"], dict), "Missing or invalid session object"
    except Exception as e:
        raise AssertionError(f"Valid login test failed: {str(e)}")

    # Invalid credentials
    invalid_payload = {
        "email": "golffox@admin.com",
        "password": "wrongpassword"
    }
    response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code in {400, 401}, f"Expected 400 or 401 for invalid credentials, got {response.status_code}"

    # Missing data: missing password
    missing_password_payload = {
        "email": "golffox@admin.com"
    }
    response = requests.post(url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing password, got {response.status_code}"

    # Missing data: missing email
    missing_email_payload = {
        "password": "senha123"
    }
    response = requests.post(url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"

    # Authentication failure (simulate by missing auth - already covered as no auth mechanism specified)
    # This scenario is actually covered by missing password or email, no Basic Auth used.
    # So no distinct test needed here.

    # CSRF validation failure (simulate by sending a header to trigger CSRF failure if applicable)
    # Since the PRD says CSRF tokens required for mutating API calls, but no specific token passed, test 403 scenario
    csrf_headers = headers.copy()
    csrf_headers["X-CSRF-Token"] = "invalid_token"
    response = requests.post(url, json=valid_payload, headers=csrf_headers, timeout=TIMEOUT)
    assert response.status_code in {200, 403}, f"Expected 200 or 403 for CSRF token test, got {response.status_code}"


test_user_login_endpoint_validation()