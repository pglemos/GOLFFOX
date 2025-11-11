import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

# Credentials for basic token authentication (to be used in Authorization header if required)
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

def test_user_login_endpoint_validation():
    headers = {
        "Content-Type": "application/json",
        # Assuming the "basic token" means a Basic Auth header, but since this is a login endpoint,
        # we will send the credentials in JSON payload and not use Basic Auth unless specified.
        # However, the instruction mentions "authType":"basic token", so we add basic auth header.
    }

    # Prepare the basic auth token header
    import base64
    token = base64.b64encode(f"{AUTH_USERNAME}:{AUTH_PASSWORD}".encode()).decode()
    headers["Authorization"] = f"Basic {token}"

    login_url = BASE_URL + LOGIN_ENDPOINT

    # Test data sets for various scenarios
    valid_payload = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    invalid_password_payload = {
        "email": AUTH_USERNAME,
        "password": "wrongpassword"
    }
    missing_email_payload = {
        "password": AUTH_PASSWORD
    }
    missing_password_payload = {
        "email": AUTH_USERNAME
    }
    empty_payload = {}

    # --------- Successful login with valid credentials ---------
    try:
        response = requests.post(login_url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during successful login test: {e}"
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    resp_json = response.json()
    assert "token" in resp_json, "Response JSON missing 'token'"
    assert "refreshToken" in resp_json, "Response JSON missing 'refreshToken'"
    assert "user" in resp_json and isinstance(resp_json["user"], dict), "Response JSON missing or invalid 'user'"
    assert "session" in resp_json and isinstance(resp_json["session"], dict), "Response JSON missing or invalid 'session'"

    # --------- Invalid credentials (wrong password) ---------
    try:
        response = requests.post(login_url, json=invalid_password_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during invalid credentials test: {e}"
    assert response.status_code in (400, 401), f"Expected 400 or 401 for invalid credentials, got {response.status_code}"

    # --------- Missing email field ---------
    try:
        response = requests.post(login_url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during missing email test: {e}"
    assert response.status_code == 400, f"Expected 400 for missing email field, got {response.status_code}"

    # --------- Missing password field ---------
    try:
        response = requests.post(login_url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during missing password test: {e}"
    assert response.status_code == 400, f"Expected 400 for missing password field, got {response.status_code}"

    # --------- Missing both email and password ---------
    try:
        response = requests.post(login_url, json=empty_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during empty payload test: {e}"
    assert response.status_code == 400, f"Expected 400 for missing both email and password, got {response.status_code}"

    # --------- CSRF Validation failure ---------
    csrf_headers = headers.copy()
    csrf_headers["X-CSRF-Token"] = "invalid_csrf_token"
    try:
        response = requests.post(login_url, json=valid_payload, headers=csrf_headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during CSRF validation test: {e}"
    assert response.status_code in (200, 403), f"Expected 403 or 200 for CSRF validation test, got {response.status_code}"

# Call the test function

test_user_login_endpoint_validation()
