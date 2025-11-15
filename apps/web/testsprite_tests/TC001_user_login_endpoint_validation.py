import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30

AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

def test_user_login_endpoint_validation():
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # 1. Successful login with valid credentials
    payload_valid = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    try:
        resp = requests.post(LOGIN_ENDPOINT, json=payload_valid, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}"
        resp_json = resp.json()
        assert "token" in resp_json and isinstance(resp_json["token"], str) and resp_json["token"], "Missing or invalid token"
        assert "refreshToken" in resp_json and isinstance(resp_json["refreshToken"], str), "Missing or invalid refreshToken"
        assert "user" in resp_json and isinstance(resp_json["user"], dict), "Missing or invalid user object"
        assert "session" in resp_json and isinstance(resp_json["session"], dict), "Missing or invalid session object"
    except requests.RequestException as e:
        assert False, f"Request failed during valid login test: {e}"

    # 2. Invalid credentials (wrong password)
    payload_invalid_password = {
        "email": AUTH_USERNAME,
        "password": "wrongpassword123"
    }
    try:
        resp = requests.post(LOGIN_ENDPOINT, json=payload_invalid_password, headers=headers, timeout=TIMEOUT)
        # According to PRD, 400 or 401 can be for invalid credentials; test expects 400 or 401
        assert resp.status_code in (400, 401), f"Expected 400 or 401 for invalid credentials but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid credentials test: {e}"

    # 3. Missing data - missing password
    payload_missing_password = {
        "email": AUTH_USERNAME
    }
    try:
        resp = requests.post(LOGIN_ENDPOINT, json=payload_missing_password, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for missing password but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during missing password test: {e}"

    # 4. Authentication failure (e.g., unregistered email)
    payload_auth_fail = {
        "email": "nonexistentuser@example.com",
        "password": "somepassword"
    }
    try:
        resp = requests.post(LOGIN_ENDPOINT, json=payload_auth_fail, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 401, f"Expected 401 Unauthorized for authentication failure but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during authentication failure test: {e}"


# Run the test

test_user_login_endpoint_validation()
