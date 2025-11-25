import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
OPTIMIZE_ROUTE_URL = f"{BASE_URL}/api/operator/optimize-route"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_optimize_route_for_operator():
    # Login to get token for authorization
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }

    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data, "Login response missing token"
        token = login_data["token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Login failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        optimize_response = requests.post(OPTIMIZE_ROUTE_URL, headers=headers, timeout=TIMEOUT)
        assert optimize_response.status_code == 200, f"Optimize route failed with status code {optimize_response.status_code}"
        # The spec does not mandate specific response body; checking presence of success message or similar
        resp_json = optimize_response.json()
        assert resp_json is not None, "Optimize route response is empty or not JSON"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Optimize route request failed: {e}")

test_optimize_route_for_operator()