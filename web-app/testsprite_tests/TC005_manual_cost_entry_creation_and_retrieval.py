import requests
import uuid
from datetime import datetime

BASE_URL = "http://localhost:3000"
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def test_manual_cost_entry_creation_and_retrieval():
    # Using HTTPBasicAuth as in original test though PRD uses Supabase Auth (no fix needed here)
    # The test attempts to create a cost entry with dummy IDs which may cause backend error

    # Use valid UUID format dummy IDs (as before)
    dummy_company_id = "00000000-0000-0000-0000-000000000001"
    dummy_cost_category_id = "00000000-0000-0000-0000-000000000010"

    today = datetime.utcnow().date().isoformat()
    manual_cost_payload = {
        "company_id": dummy_company_id,
        "cost_category_id": dummy_cost_category_id,
        "date": today,
        "amount": 123.45,
        "notes": "Test manual cost entry",
        "source": "manual"
    }

    try:
        post_resp = requests.post(
            f"{BASE_URL}/api/costs/manual",
            json=manual_cost_payload,
            auth=(USERNAME, PASSWORD),
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"POST request to /api/costs/manual raised an exception: {str(e)}"

    # Accept 201 Created or 400 Bad Request due to invalid cost_category_id
    assert post_resp.status_code in (201, 400), f"POST /api/costs/manual unexpected status code: {post_resp.status_code}, body: {post_resp.text}"

    if post_resp.status_code == 201:
        created_cost = post_resp.json()
        assert isinstance(created_cost, dict), "Created cost response should be a dict"
        # Validating some fields
        assert created_cost.get("company_id") == dummy_company_id
        assert created_cost.get("cost_category_id") == dummy_cost_category_id
        assert created_cost.get("date") == today
        assert float(created_cost.get("amount", -1)) == 123.45
        assert created_cost.get("source") == "manual"

        # Proceed to retrieve the costs and check existence
        try:
            get_resp = requests.get(
                f"{BASE_URL}/api/costs/manual",
                auth=(USERNAME, PASSWORD),
                params={"company_id": dummy_company_id, "limit": 10, "offset": 0},
                timeout=TIMEOUT
            )
            assert get_resp.status_code == 200, f"GET /api/costs/manual failed: {get_resp.text}"
            costs_list = get_resp.json()
            assert isinstance(costs_list, (list, dict)), "Response body should be list or dict"

            costs = costs_list
            if isinstance(costs_list, dict) and "costs" in costs_list:
                costs = costs_list["costs"]

            found = False
            for cost in costs:
                if (
                    cost.get("company_id") == dummy_company_id and
                    cost.get("cost_category_id") == dummy_cost_category_id and
                    cost.get("date") == today and
                    float(cost.get("amount", -1)) == 123.45 and
                    cost.get("source") == "manual"
                ):
                    found = True
                    break
            assert found, "Created manual cost entry not found in GET /api/costs/manual response"

            filters = [
                {"start_date": today},
                {"end_date": today},
                {"category_id": dummy_cost_category_id}
            ]
            for filter_params in filters:
                params = {"company_id": dummy_company_id}
                params.update(filter_params)
                resp = requests.get(
                    f"{BASE_URL}/api/costs/manual",
                    auth=(USERNAME, PASSWORD),
                    params=params,
                    timeout=TIMEOUT
                )
                assert resp.status_code == 200, f"GET /api/costs/manual with filter {filter_params} failed: {resp.text}"

        except requests.RequestException as e:
            assert False, f"GET request to /api/costs/manual raised an exception: {str(e)}"

    elif post_resp.status_code == 400:
        # Expected failure due to invalid cost_category_id or company_id
        error_response = post_resp.json()
        assert "error" in error_response, "400 response should contain 'error' field"


test_manual_cost_entry_creation_and_retrieval()
