import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
GENERATE_STOPS_URL = f"{BASE_URL}/api/admin/generate-stops"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_generate_optimized_route_stops():
    session = requests.Session()
    # Authenticate to get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=30)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Missing or invalid token in login response"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Since route_id is not provided, create a dummy route resource to use its id
        # The PRD doesn't provide route creation endpoint, so we assume such endpoint exists /api/admin/routes
        # We'll create a route, use its id, then delete it after test
        create_route_url = f"{BASE_URL}/api/admin/routes"
        route_payload = {
            "name": "Test Route for Optimized Stops",
            "description": "Route created for test_generate_optimized_route_stops"
        }
        create_resp = session.post(create_route_url, json=route_payload, headers=headers, timeout=30)
        assert create_resp.status_code == 201, f"Route creation failed with status {create_resp.status_code}"
        created_route = create_resp.json()
        route_id = created_route.get("id")
        assert route_id and isinstance(route_id, str), "No valid route id returned on creation"

        try:
            # Test success scenario: generate optimized stops
            generate_payload = {"route_id": route_id}
            success_resp = session.post(GENERATE_STOPS_URL, json=generate_payload, headers=headers, timeout=30)
            assert success_resp.status_code == 200, f"Generate stops success failed with status {success_resp.status_code}"

            # Test failure scenario: missing route_id
            fail_resp = session.post(GENERATE_STOPS_URL, json={}, headers=headers, timeout=30)
            assert fail_resp.status_code == 500 or fail_resp.status_code == 400, \
                f"Expected failure status when route_id is missing, got {fail_resp.status_code}"

            # Test failure scenario: invalid route_id format
            invalid_payload = {"route_id": "invalid-uuid-format"}
            invalid_resp = session.post(GENERATE_STOPS_URL, json=invalid_payload, headers=headers, timeout=30)
            assert invalid_resp.status_code == 500 or invalid_resp.status_code == 400, \
                f"Expected failure status when route_id is invalid, got {invalid_resp.status_code}"

        finally:
            # Cleanup: delete the created route
            delete_route_url = f"{BASE_URL}/api/admin/routes/{route_id}"
            del_resp = session.delete(delete_route_url, headers=headers, timeout=30)
            assert del_resp.status_code in (200, 204), f"Failed to delete test route, status {del_resp.status_code}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    finally:
        session.close()

test_generate_optimized_route_stops()