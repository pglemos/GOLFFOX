import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

def test_user_login_endpoint_validation():
    headers = {
        "Content-Type": "application/json",
        # Basic token authentication: using HTTP Basic Auth header with provided credentials
        # Encoding username:password in base64 is normally done by requests when using auth parameter
    }

    # 1. Successful login with valid credentials
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": AUTH_USERNAME, "password": AUTH_PASSWORD},
            timeout=TIMEOUT,
        )
        assert response.status_code == 200, f"Expected 200 on valid login, got {response.status_code}"
        json_data = response.json()
        assert "token" in json_data, "Response JSON must contain token"
        assert "refreshToken" in json_data, "Response JSON must contain refreshToken"
        assert "user" in json_data and isinstance(json_data["user"], dict), "User object required"
        assert "session" in json_data and isinstance(json_data["session"], dict), "Session object required"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Failed valid login test: {e}")

    # 2. Invalid credentials - wrong password
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": AUTH_USERNAME, "password": "wrongpassword"},
            timeout=TIMEOUT,
        )
        assert response.status_code in (400, 401), f"Expected 400 or 401 for invalid credentials, got {response.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for invalid credentials: {e}")

    # 3. Missing data - missing password
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": AUTH_USERNAME},
            timeout=TIMEOUT,
        )
        assert response.status_code == 400, f"Expected 400 for missing password, got {response.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for missing password: {e}")

    # 4. Missing data - missing email
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"password": AUTH_PASSWORD},
            timeout=TIMEOUT,
        )
        assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for missing email: {e}")

    # 5. Empty JSON payload (missing both email and password)
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={},
            timeout=TIMEOUT,
        )
        assert response.status_code == 400, f"Expected 400 for empty payload, got {response.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for empty payload: {e}")

    # 6. Authentication failure scenario - simulate by invalid email format
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": "invalid_email_format", "password": AUTH_PASSWORD},
            timeout=TIMEOUT,
        )
        # Could be 400 for validation error or 401 for authentication failed or 422 for validation error
        assert response.status_code in (400, 401, 422), f"Expected 400, 401 or 422 for invalid email format, got {response.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for invalid email format: {e}")

    # 7. CSRF validation failure - Since CSRF token required for mutating calls,
    # simulate by sending header or cookie invalid or missing
    # But API doc does not specify how CSRF token is passed on login endpoint
    # Usually login might be exempt or accept a CSRF header
    # We'll try sending an invalid CSRF header to elicit 403 response

    # Attempt with invalid CSRF token header
    try:
        headers_with_csrf = {"Content-Type": "application/json", "x-csrf-token": "invalid-token"}
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": AUTH_USERNAME, "password": AUTH_PASSWORD},
            headers=headers_with_csrf,
            timeout=TIMEOUT,
        )
        if response.status_code == 403:
            # Expected CSRF validation failure
            pass
        else:
            # 403 not returned, maybe CSRF not enforced on login, so just verify code is not 200 error
            assert response.status_code != 200, "Expected non-200 response when CSRF token invalid"
    except requests.RequestException as e:
        raise AssertionError(f"Request failed for CSRF validation failure test: {e}")

test_user_login_endpoint_validation()
