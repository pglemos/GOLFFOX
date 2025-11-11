import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Placeholder for valid bearer token for authentication
BEARER_TOKEN = "your_valid_token_here"

def test_verify_cost_kpis_retrieval():
    url = f"{BASE_URL}/api/costs/kpis"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    # Validate response fields
    assert isinstance(data, dict), "Response JSON is not an object"
    expected_keys = {"totalCosts", "budget", "variance"}
    missing_keys = expected_keys - data.keys()
    assert not missing_keys, f"Response JSON missing keys: {missing_keys}"

    # Validate each KPI is a number (int or float)
    for key in expected_keys:
        value = data[key]
        assert isinstance(value, (int, float)), f"KPIs key '{key}' is not a number"

    # Optionally: Check values reasonable (non-negative)
    for key in expected_keys:
        assert data[key] >= 0, f"KPIs key '{key}' has negative value"


test_verify_cost_kpis_retrieval()