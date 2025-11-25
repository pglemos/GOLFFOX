import requests

BASE_URL = "http://localhost:3000"

AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"

TIMEOUT = 30

def test_optimize_route_for_operator():
    session = requests.Session()
    # Authenticate to get Bearer token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    try:
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        login_resp.raise_for_status()
        login_data = login_resp.json()
        token = login_data.get("token")
        if not token:
            assert False, "Authentication token not found in login response."
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    optimize_url = f"{BASE_URL}/api/operator/optimize-route"
    try:
        resp = session.post(optimize_url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        assert resp.status_code == 200
        # Optionally verify response content if any
    except requests.HTTPError as http_err:
        assert False, f"HTTP error during optimize route: {http_err} - Response: {resp.text}"
    except requests.RequestException as req_err:
        assert False, f"Request exception during optimize route: {req_err}"

test_optimize_route_for_operator()