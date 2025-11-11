import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
OPTIMIZE_ROUTE_URL = f"{BASE_URL}/api/operator/optimize-route"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_optimize_route_for_operator():
    # Authenticate to get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_response = requests.post(
            LOGIN_URL,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_data = login_response.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token not present or invalid in login response"
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    # Call optimize-route endpoint with bearer authentication
    headers = {
        "Authorization": f"Bearer {token}"
    }
    try:
        optimize_response = requests.post(
            OPTIMIZE_ROUTE_URL,
            headers=headers,
            timeout=TIMEOUT
        )
        assert optimize_response.status_code == 200, f"Optimize route failed with status code {optimize_response.status_code}"
    except requests.RequestException as e:
        assert False, f"Optimize route request failed: {e}"

test_optimize_route_for_operator()