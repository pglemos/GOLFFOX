import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
OPTIMIZE_ROUTE_URL = f"{BASE_URL}/api/operator/optimize-route"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"


def test_optimize_route_for_operator():
    try:
        # Login to get bearer token
        login_payload = {"email": USERNAME, "password": PASSWORD}
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "Token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Call optimize route endpoint
        optimize_resp = requests.post(OPTIMIZE_ROUTE_URL, headers=headers, timeout=TIMEOUT)
        assert optimize_resp.status_code == 200, f"Optimize route failed: {optimize_resp.text}"

        # Optionally, validate response content if applicable (API doc states only 200 desc)
        # But we check JSON parse and a success message or any indication.
        try:
            data = optimize_resp.json()
        except Exception:
            data = None
        # If response body present and JSON, check for typical confirmation field if any
        # Since no schema given, just check JSON object or empty response
        assert data is None or isinstance(data, dict), "Response is not valid JSON object"

    except requests.RequestException as e:
        assert False, f"Request exception occurred: {e}"


test_optimize_route_for_operator()