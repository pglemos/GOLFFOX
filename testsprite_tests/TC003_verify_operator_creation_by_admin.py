import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "AdminPass123!"

def test_verify_operator_creation_by_admin():
    session = requests.Session()
    try:
        # 1. Admin login to get bearer token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        assert token, "No token received on admin login"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # 2. Valid operator creation request
        valid_payload = {
            "companyName": "Test Company ABC",
            "operatorEmail": "operator@testcompanyabc.com",
            "operatorPhone": "+5511999999999"
        }
        create_resp = session.post(
            f"{BASE_URL}/api/admin/create-operator",
            json=valid_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Valid operator creation failed: {create_resp.text}"

        # 3. Invalid data request (missing required operatorEmail)
        invalid_payload = {
            "companyName": "Invalid Company",
            "operatorPhone": "+5511888888888"
        }
        invalid_resp = session.post(
            f"{BASE_URL}/api/admin/create-operator",
            json=invalid_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert invalid_resp.status_code == 400, "Invalid data was accepted when it should be rejected"

        # 4. Unauthorized access (no token)
        no_auth_resp = session.post(
            f"{BASE_URL}/api/admin/create-operator",
            json=valid_payload,
            timeout=TIMEOUT,
        )
        assert no_auth_resp.status_code == 401, "Unauthorized request did not return 401 status"

    finally:
        session.close()

test_verify_operator_creation_by_admin()
