import requests
from requests.auth import HTTPBasicAuth
import uuid
from datetime import date, timedelta

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_manual_cost_entry_creation_and_retrieval():
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json",
    }

    # Step 1: Retrieve company_id and cost_category_id for testing filters
    # Since no specific companies or category IDs were provided, we create a manual cost entry to obtain valid IDs
    # Provide some test data for creation
    today_str = date.today().isoformat()
    test_company_id = str(uuid.uuid4())
    test_cost_category_id = str(uuid.uuid4())
    test_date = today_str
    test_amount = 123.45
    test_notes = "Test manual cost entry"
    test_source = "manual"

    cost_entry_payload = {
        "company_id": test_company_id,
        "cost_category_id": test_cost_category_id,
        "date": test_date,
        "amount": test_amount,
        "notes": test_notes,
        "source": test_source
    }

    # POST /api/costs/manual: create manual cost entry
    create_response = requests.post(
        f"{BASE_URL}/api/costs/manual",
        json=cost_entry_payload,
        auth=auth,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert create_response.status_code == 201, f"Expected 201 Created but got {create_response.status_code}: {create_response.text}"

    # Step 2: GET /api/costs/manual with various filters
    # Prepare query params with required company_id and optional filters
    # Test filters: company_id only (required), also add category_id, start_date, end_date, limit, offset
    query_params_list = [
        {"company_id": test_company_id},  # minimal required
        {
            "company_id": test_company_id,
            "category_id": test_cost_category_id,
            "start_date": (date.today() - timedelta(days=1)).isoformat(),
            "end_date": (date.today() + timedelta(days=1)).isoformat(),
            "limit": 10,
            "offset": 0,
        },
        {
            "company_id": test_company_id,
            "limit": 1,
        },
        {
            "company_id": test_company_id,
            "offset": 5,
        },
    ]

    for params in query_params_list:
        get_response = requests.get(
            f"{BASE_URL}/api/costs/manual",
            params=params,
            auth=auth,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert get_response.status_code == 200, f"GET request failed with status code {get_response.status_code}: {get_response.text}"
        try:
            costs_data = get_response.json()
        except Exception:
            raise AssertionError("Response is not valid JSON")

        assert isinstance(costs_data, (list, dict)), "Costs response is not a list or dict"

# No cleanup is required as endpoint likely stores the cost entry

test_manual_cost_entry_creation_and_retrieval()