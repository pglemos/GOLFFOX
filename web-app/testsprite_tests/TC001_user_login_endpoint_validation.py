import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_user_login_endpoint_validation():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }

    # 1. Test successful login with valid credentials
    valid_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        json_response = response.json()
        assert "token" in json_response and isinstance(json_response["token"], str), "Missing or invalid token in response"
        assert "refreshToken" in json_response and isinstance(json_response["refreshToken"], str), "Missing or invalid refreshToken in response"
        assert "user" in json_response and isinstance(json_response["user"], dict), "Missing or invalid user object in response"
        assert "session" in json_response and isinstance(json_response["session"], dict), "Missing or invalid session object in response"
    except Exception as e:
        raise AssertionError(f"Successful login test failed: {e}")

    # 2. Test login with invalid credentials
    invalid_payload = {
        "email": USERNAME,
        "password": "wrongpassword"
    }
    try:
        response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code in (400, 401), f"Expected 400 or 401 for invalid credentials, got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Invalid credentials test failed: {e}")

    # 3. Test login with missing email
    missing_email_payload = {
        "password": PASSWORD
    }
    try:
        response = requests.post(url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Missing email test failed: {e}")

    # 4. Test login with missing password
    missing_password_payload = {
        "email": USERNAME
    }
    try:
        response = requests.post(url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 for missing password, got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Missing password test failed: {e}")

    # 5. Test authentication failure (simulate by invalid credentials)
    wrong_payload = {
        "email": "wronguser@example.com",
        "password": "wrongpass"
    }
    try:
        response = requests.post(url, json=wrong_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code in (400, 401), f"Expected 400 or 401 for wrong credentials, got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"Authentication failure test failed: {e}")

    # 6. Test CSRF validation failure (simulate by omitting any CSRF token if required)
    # Since no specific CSRF token header or data was described, simulate by sending request without auth or malformed headers
    # We attempt without payload to trigger CSRF or similar rejection
    try:
        response = requests.post(url, headers=headers, timeout=TIMEOUT)
        # API may respond 400 or 403 depending on CSRF or payload validation
        assert response.status_code == 400 or response.status_code == 403, f"Expected 400 or 403 for CSRF validation failure or missing payload, got {response.status_code}"
    except Exception as e:
        raise AssertionError(f"CSRF validation failure test failed: {e}")


test_user_login_endpoint_validation()
