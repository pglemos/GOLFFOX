import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
OPTIMIZE_ROUTE_URL = f"{BASE_URL}/api/operator/optimize-route"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_optimize_route_for_operator():
    timeout = 30
    # Step 1: Login to get bearer token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=timeout)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "Login response missing token"
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        # Step 2: Optimize route for operator
        optimize_resp = requests.post(OPTIMIZE_ROUTE_URL, headers=headers, timeout=timeout)
        assert optimize_resp.status_code == 200, f"Optimize route failed with status {optimize_resp.status_code}"
    except Exception as e:
        raise AssertionError(f"Optimize route request failed: {e}")

test_optimize_route_for_operator()