import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
OPTIMIZE_ROUTE_URL = f"{BASE_URL}/api/operator/optimize-route"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"


def test_optimize_route_for_operator():
    try:
        # Authenticate to get token
        login_payload = {"email": USERNAME, "password": PASSWORD}
        login_response = requests.post(
            LOGIN_URL, json=login_payload, timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token missing or invalid in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # POST to /api/operator/optimize-route to optimize route for operator
        optimize_response = requests.post(
            OPTIMIZE_ROUTE_URL, headers=headers, timeout=TIMEOUT
        )
        assert optimize_response.status_code == 200, f"Optimize route failed: {optimize_response.text}"

        # Optionally check response content for success message or expected keys
        # Here just ensure JSON response
        resp_json = optimize_response.json()
        assert isinstance(resp_json, dict), "Response is not a JSON object"

    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"


test_optimize_route_for_operator()