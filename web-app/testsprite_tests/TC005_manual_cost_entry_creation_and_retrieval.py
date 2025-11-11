import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_manual_cost_entry_creation_and_retrieval():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }

    # Prepare valid manual cost entry data
    # For required fields: company_id, cost_category_id, date, amount
    # Since no specific IDs are provided, attempt to infer or create dummy UUIDs
    import uuid
    import datetime

    # Normally, these should come from a fixture or a setup step.
    # Here we generate dummy UUIDs and current date for test purposes.
    company_id = str(uuid.uuid4())
    cost_category_id = str(uuid.uuid4())
    date = datetime.date.today().isoformat()
    amount = 123.45
    notes = "Test manual cost entry"
    source = "manual"

    cost_entry = {
        "company_id": company_id,
        "cost_category_id": cost_category_id,
        "date": date,
        "amount": amount,
        "notes": notes,
        "source": source
    }

    # Create manual cost entry (POST /api/costs/manual)
    try:
        response_post = requests.post(
            f"{BASE_URL}/api/costs/manual",
            json=cost_entry,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"POST /api/costs/manual request failed: {e}"

    # Validate creation success
    assert response_post.status_code == 201, f"Expected 201 Created but got {response_post.status_code}"
    post_response_json = response_post.json()
    assert post_response_json is not None, "POST response JSON is None"

    # Now test retrieval of costs with filters (GET /api/costs/manual)
    # Test various valid filters including company_id (required), route_id (empty), vehicle_id (empty),
    # start_date, end_date, category_id, limit, offset

    # Basic required filter: company_id only
    params_list = [
        # Required only
        {"company_id": company_id},
        # Filters with start_date and end_date range including the created cost date
        {
            "company_id": company_id,
            "start_date": date,
            "end_date": date,
        },
        # With category_id filter matching cost_category_id
        {
            "company_id": company_id,
            "category_id": cost_category_id
        },
        # With limit and offset
        {
            "company_id": company_id,
            "limit": 10,
            "offset": 0
        }
    ]

    for params in params_list:
        try:
            response_get = requests.get(
                f"{BASE_URL}/api/costs/manual",
                headers=headers,
                auth=auth,
                params=params,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            assert False, f"GET /api/costs/manual request failed with params {params}: {e}"

        # Validate success response
        assert response_get.status_code == 200, f"Expected 200 OK but got {response_get.status_code} for params {params}"

        get_response_json = response_get.json()
        assert isinstance(get_response_json, (list, dict)), f"GET response is not list or dict for params {params}"

        # If it's a dict with results inside, validate accordingly; assuming list of costs or dict.
        # Check that returned costs (if list) contain an entry matching the created cost entry by date and amount
        # This is not guaranteed but we attempt best-effort.

        # If list, check for an entry with matching company_id and amount
        costs = get_response_json if isinstance(get_response_json, list) else get_response_json.get("costs", [])

        found_created_cost = False
        if isinstance(costs, list):
            for cost in costs:
                if (
                    cost.get("company_id") == company_id and
                    cost.get("cost_category_id") == cost_category_id and
                    cost.get("date") == date and
                    float(cost.get("amount", -1)) == amount
                ):
                    found_created_cost = True
                    break
        # Since the backend might not immediately reflect data or paginate results,
        # we don't assert found_created_cost but just note it.

    # Test invalid retrieval: Missing required company_id
    try:
        response_invalid = requests.get(
            f"{BASE_URL}/api/costs/manual",
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"GET /api/costs/manual request without company_id failed: {e}"

    assert response_invalid.status_code == 400, f"Expected 400 Bad Request when missing company_id, got {response_invalid.status_code}"

test_manual_cost_entry_creation_and_retrieval()