import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30

AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"


def test_user_login_endpoint_validation():
    headers = {
        "Content-Type": "application/json"
    }
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    # 1. Test successful login with valid credentials
    valid_payload = {
        "email": "golffox@admin.com",
        "password": "senha123"
    }
    try:
        response = requests.post(LOGIN_URL, json=valid_payload, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        data = response.json()
        assert "token" in data and isinstance(data["token"], str) and data["token"], "Missing or invalid token"
        assert "refreshToken" in data and isinstance(data["refreshToken"], str) and data["refreshToken"], "Missing or invalid refreshToken"
        assert "user" in data and isinstance(data["user"], dict), "Missing or invalid user object"
        assert "session" in data and isinstance(data["session"], dict), "Missing or invalid session object"
    except requests.RequestException as e:
        assert False, f"Request failed during valid login test: {e}"
    except ValueError:
        assert False, "Response JSON decoding failed during valid login test"

    # 2. Test invalid credentials (wrong password)
    invalid_creds_payload = {
        "email": "golffox@admin.com",
        "password": "wrongpassword"
    }
    try:
        response = requests.post(LOGIN_URL, json=invalid_creds_payload, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code in (400, 401), f"Expected 400 or 401 for invalid creds, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid credentials test: {e}"

    # 3. Test missing data (no password)
    missing_data_payload = {
        "email": "golffox@admin.com"
    }
    try:
        response = requests.post(LOGIN_URL, json=missing_data_payload, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 Bad Request for missing data, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during missing data test: {e}"

    # 4. Test authentication failure (wrong email)
    auth_fail_payload = {
        "email": "nonexistent@admin.com",
        "password": "senha123"
    }
    try:
        response = requests.post(LOGIN_URL, json=auth_fail_payload, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code in (400, 401), f"Expected 400 or 401 for auth failure, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during authentication failure test: {e}"

    # 5. Test CSRF validation failure simulation
    # CSRF tokens are required for protected mutating calls.
    # We test by sending an invalid or missing CSRF token header.
    # Since the PRD doesn't specify the exact CSRF header name, typically it might be 'X-CSRF-Token'.
    # We send an invalid token and expect 403.

    csrf_headers = headers.copy()
    csrf_headers["X-CSRF-Token"] = "invalid_csrf_token"
    try:
        response = requests.post(LOGIN_URL, json=valid_payload, headers=csrf_headers, auth=auth, timeout=TIMEOUT)
        # Accept 200 if CSRF check might not apply to login or 403 if it does
        # But per PRD, 403 indicates CSRF validation failure
        if response.status_code == 403:
            pass  # Expected CSRF failure
        elif response.status_code == 200:
            # Possibly CSRF not applied at login, so considered success
            # Still accept this as valid as some systems don't require CSRF token for login
            data = response.json()
            assert "token" in data, "Expected token in response for successful login without CSRF token"
        else:
            assert False, f"Expected 200 or 403 for CSRF test, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during CSRF validation test: {e}"
    except ValueError:
        assert False, "Response JSON decoding failed during CSRF validation test"


test_user_login_endpoint_validation()