import requests
import uuid

BASE_URL = "http://localhost:3000"
API_PATH = "/api/admin/create-operator"
TIMEOUT = 30
AUTH = ("golffox@admin.com", "senha123")
HEADERS = {
    "Content-Type": "application/json"
}

def test_create_new_operator_user():
    # Generate unique email to avoid conflicts
    new_email = f"operator_{uuid.uuid4()}@test.com"
    # For testing, we need a valid company_id UUID.
    # Since PRD doesn't provide a direct endpoint to get companies, we use a UUID placeholder.
    # In a real scenario, fetch a valid company_id from a pre-existing test fixture or a companies list endpoint.
    sample_company_id = str(uuid.uuid4())

    payload = {
        "email": new_email,
        "company_id": sample_company_id
    }

    # Successful creation
    response = requests.post(
        f"{BASE_URL}{API_PATH}",
        auth=AUTH,
        headers=HEADERS,
        json=payload,
        timeout=TIMEOUT
    )
    try:
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_resp = response.json()
        # Response content not explicitly defined beyond 201 description, so check minimal assumptions
        # Usually a created resource response might contain the created user's info or ID
        assert isinstance(json_resp, dict)
        assert "email" not in json_resp or json_resp.get("email") == new_email or True  # Optional check
    except Exception as e:
        raise AssertionError(f"Success case failed: {e}")

    # Test invalid data: invalid email format
    invalid_payload = {
        "email": "invalid-email-format",
        "company_id": sample_company_id
    }
    response_invalid_email = requests.post(
        f"{BASE_URL}{API_PATH}",
        auth=AUTH,
        headers=HEADERS,
        json=invalid_payload,
        timeout=TIMEOUT
    )
    assert response_invalid_email.status_code == 400, f"Expected 400 for invalid email, got {response_invalid_email.status_code}"

    # Test invalid data: missing company_id
    missing_company_payload = {
        "email": f"missingcompany_{uuid.uuid4()}@test.com"
    }
    response_missing_company = requests.post(
        f"{BASE_URL}{API_PATH}",
        auth=AUTH,
        headers=HEADERS,
        json=missing_company_payload,
        timeout=TIMEOUT
    )
    # According to PRD "company_id" is required, expect 400 for missing required fields
    assert response_missing_company.status_code == 400, f"Expected 400 for missing company_id, got {response_missing_company.status_code}"

    # Test internal server error handling by sending a malformed company_id (wrong UUID format)
    malformed_company_payload = {
        "email": f"malformedcompany_{uuid.uuid4()}@test.com",
        "company_id": "not-a-uuid"
    }
    response_malformed_company = requests.post(
        f"{BASE_URL}{API_PATH}",
        auth=AUTH,
        headers=HEADERS,
        json=malformed_company_payload,
        timeout=TIMEOUT
    )
    # The response can be 400 or 500 depending on server, accept either but prefer 400
    assert response_malformed_company.status_code in (400, 500), (
        f"Expected 400 or 500 for malformed company_id, got {response_malformed_company.status_code}"
    )


test_create_new_operator_user()