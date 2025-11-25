import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
ENDPOINT = "/api/admin/create-operator"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_create_new_operator_user():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # Prepare valid payload with unique email and a dummy company_id (UUID4)
    email = f"operator_{uuid.uuid4().hex[:8]}@example.com"
    # For company_id, provide a valid UUID format, simulate a company Id for the test
    # As no company create endpoint data provided, use a random UUID here.
    company_id = str(uuid.uuid4())

    payload = {
        "email": email,
        "company_id": company_id
    }

    # Test success case: create operator with valid data
    response = requests.post(
        BASE_URL + ENDPOINT,
        auth=auth,
        headers=headers,
        json=payload,
        timeout=TIMEOUT
    )

    assert response.status_code == 201, f"Expected status code 201 but got {response.status_code}, response: {response.text}"

    # Additional validation of response content if JSON
    try:
        data = response.json()
    except Exception:
        data = None
    
    assert data is None or isinstance(data, dict), "Response is not valid JSON object"

    # Test error case: invalid email
    invalid_payload = {
        "email": "invalid-email",
        "company_id": company_id
    }
    error_response = requests.post(
        BASE_URL + ENDPOINT,
        auth=auth,
        headers=headers,
        json=invalid_payload,
        timeout=TIMEOUT
    )
    assert error_response.status_code == 400, f"Expected 400 for invalid email but got {error_response.status_code}, response: {error_response.text}"

    # Test error case: missing company_id (should get 400)
    missing_company_payload = {
        "email": f"operator_{uuid.uuid4().hex[:8]}@example.com"
    }
    missing_company_resp = requests.post(
        BASE_URL + ENDPOINT,
        auth=auth,
        headers=headers,
        json=missing_company_payload,
        timeout=TIMEOUT
    )
    assert missing_company_resp.status_code == 400, f"Expected 400 for missing company_id but got {missing_company_resp.status_code}, response: {missing_company_resp.text}"

test_create_new_operator_user()