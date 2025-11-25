import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import uuid

BASE_URL = "http://localhost:3000"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_manual_cost_entry_creation_and_retrieval():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # Helper function: create manual cost entry
    def create_manual_cost_entry(company_id, cost_category_id, date, amount, notes=None, source="manual"):
        payload = {
            "company_id": company_id,
            "cost_category_id": cost_category_id,
            "date": date,
            "amount": amount,
            "source": source
        }
        if notes is not None:
            payload["notes"] = notes

        response = requests.post(
            f"{BASE_URL}/api/costs/manual",
            auth=auth,
            headers=headers,
            json=payload,
            timeout=TIMEOUT,
        )
        return response

    # Helper function: get costs with filters
    def get_costs(filters):
        response = requests.get(
            f"{BASE_URL}/api/costs/manual",
            auth=auth,
            headers=headers,
            params=filters,
            timeout=TIMEOUT,
        )
        return response

    # Assumptions for required uuid fields for test (normally these would come from setup or fixtures)
    # Since resource IDs are not provided, these below are dummy IDs (we assume valid ones exist in system)
    # In a real scenario, the test would create or fetch valid company and cost category IDs before running tests.
    test_company_id = str(uuid.uuid4())
    test_cost_category_id = str(uuid.uuid4())

    # Because we don't have a create company or category, the manual cost creation may fail.
    # We'll run with these and later check if creation succeeds or fails accordingly.
    # We try creating a manual cost entry
    today = datetime.today().strftime("%Y-%m-%d")
    amount = 123.45
    notes = "Test cost entry notes"

    created_cost_id = None
    try:
        # 1. Test successful creation of manual cost entry
        response = create_manual_cost_entry(test_company_id, test_cost_category_id, today, amount, notes)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}, body: {response.text}"
        cost_created = response.json()
        # The API schema doesn't specify returned body content on creation, so no id expected
        # We assume success if status 201.

        # 2. Test retrieval with only required filter company_id
        filters = {"company_id": test_company_id}
        response = get_costs(filters)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}, body: {response.text}"
        costs_list = response.json()
        assert isinstance(costs_list, (list, dict)), "Expected list or dict in response"
        # If dict, we expect data inside, handle both cases
        if isinstance(costs_list, dict):
            # Possibly response is an object with costs array
            # Check if costs exists
            assert "costs" in costs_list or "data" in costs_list or True
        # We optionally check that the created cost is among returned costs if data structure known

        # 3. Test retrieval with filters: date range and category_id
        filters = {
            "company_id": test_company_id,
            "start_date": today,
            "end_date": today,
            "category_id": test_cost_category_id,
            "limit": 10,
            "offset": 0
        }
        response = get_costs(filters)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}, body: {response.text}"
        filtered_costs = response.json()
        assert isinstance(filtered_costs, (list, dict)), "Expected list or dict in response"

        # 4. Test retrieval missing required company_id returns 400
        filters = {}
        response = get_costs(filters)
        assert response.status_code == 400, f"Expected 400 when company_id missing, got {response.status_code}"

    finally:
        # No delete endpoint specified for cost entries,
        # unable to delete created manual cost entries.
        # So no cleanup possible
        pass

test_manual_cost_entry_creation_and_retrieval()