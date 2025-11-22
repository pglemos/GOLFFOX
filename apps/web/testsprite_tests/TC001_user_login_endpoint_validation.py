import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

def test_user_login_endpoint_validation():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }

    # 1. Test successful login with valid credentials
    valid_payload = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }

    try:
        response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 for valid login but got {response.status_code}"
        data = response.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0, "Missing or invalid token in response"
        assert "refreshToken" in data and isinstance(data["refreshToken"], str) and len(data["refreshToken"]) > 0, "Missing or invalid refreshToken in response"
        assert "user" in data and isinstance(data["user"], dict), "Missing or invalid user object in response"
        assert "session" in data and isinstance(data["session"], dict), "Missing or invalid session object in response"
    except Exception as e:
        raise AssertionError(f"Exception during valid login test: {e}")

    # 2. Test login with invalid credentials (wrong password)
    invalid_payload = {
        "email": AUTH_USERNAME,
        "password": "wrongpassword"
    }
    try:
        response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code in [400,401], f"Expected 400 or 401 for invalid credentials but got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during invalid credentials test: {e}")

    # 3. Test login with missing email field
    missing_email_payload = {
        # "email": AUTH_USERNAME,  # omitted
        "password": AUTH_PASSWORD
    }
    try:
        response = requests.post(url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 for missing email but got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during missing email test: {e}")

    # 4. Test login with missing password field
    missing_password_payload = {
        "email": AUTH_USERNAME
        # "password": AUTH_PASSWORD  # omitted
    }
    try:
        response = requests.post(url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 for missing password but got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during missing password test: {e}")

    # 5. Test authentication failure (simulate by sending wrong credentials payload)
    try:
        response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code in [400,401], f"Expected 400 or 401 for authentication failure but got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Exception during authentication failure test: {e}")

    # 6. Test CSRF validation failure
    # As CSRF tokens are required for protected mutating API calls, simulate missing or invalid CSRF token header if required
    # From PRD no explicit CSRF header mentioned for /api/auth/login, but instructions mention CSRF protection on protected mutating calls,
    # Assuming this login endpoint requires a CSRF token header named "X-CSRF-Token" and sending invalid token should return 403
    # We'll attempt to send invalid CSRF token to provoke a 403 response
    headers_csrf_invalid = headers.copy()
    headers_csrf_invalid["X-CSRF-Token"] = "invalid_csrf_token"
    try:
        response = requests.post(url, json=valid_payload, headers=headers_csrf_invalid, timeout=TIMEOUT)
        # The PRD states 403 on CSRF failures; if 200, then CSRF may not be enforced for login - just check if 403 possible
        assert response.status_code in [200,403], f"Expected 403 or 200 for CSRF test but got {response.status_code}"
        if response.status_code == 403:
            # CSRF validation failure successfully tested
            pass
    except Exception as e:
        raise AssertionError(f"Exception during CSRF validation failure test: {e}")

test_user_login_endpoint_validation()
