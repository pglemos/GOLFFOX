import requests
from requests.auth import HTTPBasicAuth
import uuid
import datetime

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("golffox@admin.com", "senha123")
TIMEOUT = 30

def test_manual_cost_entry_creation_and_retrieval():
    # First, create a manual cost entry using POST /api/costs/manual
    create_url = f"{BASE_URL}/api/costs/manual"
    get_url = f"{BASE_URL}/api/costs/manual"
    
    # Prepare minimal valid payload for manual cost creation
    company_id = str(uuid.uuid4())
    cost_category_id = str(uuid.uuid4())
    today = datetime.date.today().strftime("%Y-%m-%d")
    cost_data = {
        "company_id": company_id,
        "cost_category_id": cost_category_id,
        "date": today,
        "amount": 123.45,
        "notes": "Test manual cost entry creation",
        "source": "manual"
    }
    
    # Create manual cost entry
    response_post = requests.post(create_url, json=cost_data, auth=AUTH, timeout=TIMEOUT)
    assert response_post.status_code == 201, f"Expected 201 Created, got {response_post.status_code}, response: {response_post.text}"
    
    created_cost = response_post.json()
    
    # GET /api/costs/manual with various filters including company_id (required)
    # Test retrieving costs filtered by company_id only
    params = {"company_id": company_id}
    response_get = requests.get(get_url, params=params, auth=AUTH, timeout=TIMEOUT)
    assert response_get.status_code == 200, f"Expected 200 OK, got {response_get.status_code}, response: {response_get.text}"
    response_json = response_get.json()
    # Adjusted: Extract costs list from response optionally using 'costs' or 'data' keys or fallback
    if isinstance(response_json, dict):
        if 'costs' in response_json:
            costs_list = response_json['costs']
        elif 'data' in response_json:
            costs_list = response_json['data']
        else:
            costs_list = list(response_json.values())[0] if response_json else []
    else:
        costs_list = response_json
    assert isinstance(costs_list, list), f"Expected list of costs, got {type(costs_list)}"
    # Check the created cost is in the retrieved list by matching key fields
    matching_costs = [
        c for c in costs_list 
        if c.get("company_id") == company_id and 
           c.get("cost_category_id") == cost_category_id and 
           c.get("date") == today and
           float(c.get("amount", -1)) == 123.45 and
           c.get("source", "") == "manual"
    ]
    assert len(matching_costs) > 0, "Created manual cost entry not found in retrieved costs"
    
    # Additional filtering tests
    # Add date range filter: start_date and end_date
    params_date_filter = {
        "company_id": company_id,
        "start_date": today,
        "end_date": today
    }
    response_get_date = requests.get(get_url, params=params_date_filter, auth=AUTH, timeout=TIMEOUT)
    assert response_get_date.status_code == 200, f"Expected 200 OK with date filter, got {response_get_date.status_code}, response: {response_get_date.text}"
    response_json_date = response_get_date.json()
    if isinstance(response_json_date, dict):
        if 'costs' in response_json_date:
            costs_date = response_json_date['costs']
        elif 'data' in response_json_date:
            costs_date = response_json_date['data']
        else:
            costs_date = list(response_json_date.values())[0] if response_json_date else []
    else:
        costs_date = response_json_date
    assert any(c.get("date") == today for c in costs_date), "No costs found for the given date range filter"
    
    # Add category_id filter (called category_id in query, corresponds to cost_category_id)
    params_category_filter = {
        "company_id": company_id,
        "category_id": cost_category_id
    }
    response_get_category = requests.get(get_url, params=params_category_filter, auth=AUTH, timeout=TIMEOUT)
    assert response_get_category.status_code == 200, f"Expected 200 OK with category filter, got {response_get_category.status_code}, response: {response_get_category.text}"
    response_json_category = response_get_category.json()
    if isinstance(response_json_category, dict):
        if 'costs' in response_json_category:
            costs_category = response_json_category['costs']
        elif 'data' in response_json_category:
            costs_category = response_json_category['data']
        else:
            costs_category = list(response_json_category.values())[0] if response_json_category else []
    else:
        costs_category = response_json_category
    assert any(c.get("cost_category_id") == cost_category_id for c in costs_category), "No costs found for the given category filter"
    
    # Test missing required 'company_id' in GET request to get costs
    response_get_missing = requests.get(get_url, auth=AUTH, timeout=TIMEOUT)
    assert response_get_missing.status_code == 400, f"Expected 400 Bad Request when missing company_id, got {response_get_missing.status_code}"

test_manual_cost_entry_creation_and_retrieval()