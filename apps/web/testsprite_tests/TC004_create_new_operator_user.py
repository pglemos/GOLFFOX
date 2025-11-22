import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
CREATE_OPERATOR_ENDPOINT = "/api/admin/create-operator"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_create_new_operator_user():
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    test_email = f"test_operator_{uuid.uuid4().hex}@example.com"
    test_company_id = str(uuid.uuid4())

    payload = {
        "email": test_email,
        "company_id": test_company_id
    }

    try:
        response = requests.post(
            f"{BASE_URL}{CREATE_OPERATOR_ENDPOINT}",
            json=payload,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}: {response.text}"

        # Test invalid data: missing email
        invalid_payload = {"company_id": test_company_id}
        invalid_resp = requests.post(
            f"{BASE_URL}{CREATE_OPERATOR_ENDPOINT}",
            json=invalid_payload,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert invalid_resp.status_code == 400, f"Expected 400 for missing email, got {invalid_resp.status_code}"

        # Test invalid data: invalid email format
        invalid_payload = {"email": "invalidemail", "company_id": test_company_id}
        invalid_resp2 = requests.post(
            f"{BASE_URL}{CREATE_OPERATOR_ENDPOINT}",
            json=invalid_payload,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert invalid_resp2.status_code == 400 or invalid_resp2.status_code == 422, \
            f"Expected 400 or 422 for invalid email format, got {invalid_resp2.status_code}"

    except Exception as e:
        assert False, f"Test failed with exception: {e}"

test_create_new_operator_user()
