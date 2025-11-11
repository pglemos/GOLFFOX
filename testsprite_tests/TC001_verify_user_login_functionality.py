import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_verify_user_login_functionality():
    login_url = BASE_URL + LOGIN_ENDPOINT

    # Define valid and invalid test credentials
    valid_credentials = {
        "email": "valid.user@example.com",
        "password": "ValidPassword123!"
    }
    invalid_credentials = {
        "email": "invalid.user@example.com",
        "password": "WrongPassword"
    }

    # Test successful login
    try:
        response = requests.post(login_url, json=valid_credentials, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        json_data = response.json()
        assert "token" in json_data and isinstance(json_data["token"], str) and json_data["token"], "Missing or invalid 'token' in response"
        assert "user" in json_data and isinstance(json_data["user"], dict) and json_data["user"], "Missing or invalid 'user' object in response"
    except requests.RequestException as e:
        assert False, f"Request failed during valid login test: {e}"

    # Test login with invalid credentials
    try:
        response = requests.post(login_url, json=invalid_credentials, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid login test: {e}"

test_verify_user_login_functionality()
