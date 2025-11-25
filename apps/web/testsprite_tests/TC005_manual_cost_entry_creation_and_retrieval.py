import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30


def authenticate_user(email, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": email, "password": password}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    data = response.json()
    # Assuming the login returns token and session info
    token = data.get("token")
    session = data.get("session")
    assert token is not None or session is not None, "Authentication tokens missing"
    # Return token for bearer auth or cookies for session
    return token, response.cookies


def test_manual_cost_entry_creation_and_retrieval():
    token, cookies = authenticate_user(USERNAME, PASSWORD)

    # Step 1: To create a manual cost entry, we need valid company_id and cost_category_id
    company_id = str(uuid.uuid4())
    cost_category_id = str(uuid.uuid4())

    today = datetime.utcnow().date().isoformat()
    payload = {
        "company_id": company_id,
        "cost_category_id": cost_category_id,
        "date": today,
        "amount": 150.75,
        "notes": "Test manual cost entry",
        "source": "manual"
    }

    headers = {
        "Content-Type": "application/json",
        # Authorization header using Bearer token if available
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        post_response = requests.post(
            f"{BASE_URL}/api/costs/manual",
            json=payload,
            headers=headers,
            cookies=cookies,
            timeout=TIMEOUT
        )
        assert post_response.status_code == 201, f"Expected 201, got {post_response.status_code}"
        post_data = post_response.json()
        assert post_data is not None, "Response JSON is empty"

        start_date = (datetime.utcnow() - timedelta(days=7)).date().isoformat()
        end_date = datetime.utcnow().date().isoformat()
        params = {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date,
            "category_id": cost_category_id,
            "limit": 10,
            "offset": 0
        }

        get_response = requests.get(
            f"{BASE_URL}/api/costs/manual",
            headers=headers,
            cookies=cookies,
            params=params,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        costs_list = get_response.json()
        assert isinstance(costs_list, list), "Expected a list of costs"
        matches = [c for c in costs_list if c.get("company_id") == company_id and c.get("cost_category_id") == cost_category_id]
        assert len(matches) > 0, "Created cost entry not found in retrieval with filters"

        params_minimal = {"company_id": company_id}
        get_response_minimal = requests.get(
            f"{BASE_URL}/api/costs/manual",
            headers=headers,
            cookies=cookies,
            params=params_minimal,
            timeout=TIMEOUT
        )
        assert get_response_minimal.status_code == 200, f"Expected 200, got {get_response_minimal.status_code}"
        minimal_costs = get_response_minimal.json()
        assert isinstance(minimal_costs, list), "Expected a list of costs for minimal filter"

        get_response_bad = requests.get(
            f"{BASE_URL}/api/costs/manual",
            headers=headers,
            cookies=cookies,
            timeout=TIMEOUT
        )
        assert get_response_bad.status_code == 400, "Expected 400 error for missing company_id filter"

    finally:
        pass


test_manual_cost_entry_creation_and_retrieval()
