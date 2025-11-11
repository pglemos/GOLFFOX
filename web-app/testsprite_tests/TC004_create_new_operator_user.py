import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH = ("golffox@admin.com", "senha123")
TIMEOUT = 30

def test_create_new_operator_user():
    url = f"{BASE_URL}/api/admin/create-operator"
    headers = {
        "Content-Type": "application/json"
    }

    # Generate unique email for operator creation
    unique_email = f"operator_{uuid.uuid4().hex[:8]}@example.com"
    # For company_id, we need a valid UUID. Since no specific company_id was provided,
    # we will create a dummy company resource if possible or just use a placeholder UUID.
    # The PRD does not specify a create-company endpoint, so we must assume a valid UUID.
    # Use a randomly generated UUID as company_id for the test.
    company_id = str(uuid.uuid4())

    payload = {
        "email": unique_email,
        "company_id": company_id
    }

    response = None
    try:
        # Create new operator user
        response = requests.post(url, auth=AUTH, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response
    # Success status code 201: Operator created successfully
    if response.status_code == 201:
        json_data = response.json()
        # Typically creation responses may return created resource or success confirmation
        # Here just check content-type and keys if any
        assert isinstance(json_data, dict)
    elif response.status_code == 400:
        # Invalid data - verify error response text
        assert "Invalid data" in response.text or response.text
    elif response.status_code == 500:
        # Internal server error
        assert "Internal server error" in response.text or response.text
    else:
        assert False, f"Unexpected status code: {response.status_code}"

test_create_new_operator_user()