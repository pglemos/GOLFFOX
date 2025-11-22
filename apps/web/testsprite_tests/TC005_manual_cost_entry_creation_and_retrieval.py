import requests
import datetime

BASE_URL = "http://localhost:3000"
AUTH_EMAIL = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30


def get_auth_token(email, password):
    login_payload = {"email": email, "password": password}
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/api/auth/login", headers=headers, json=login_payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed with status {response.status_code}, content: {response.text}"
    data = response.json()
    token = data.get('token')
    assert token, "No token found in login response"
    return token


def test_manual_cost_entry_creation_and_retrieval():
    # Obtain bearer token via login
    token = get_auth_token(AUTH_EMAIL, AUTH_PASSWORD)

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    test_company_id = "11111111-1111-1111-1111-111111111111"
    test_category_id = "22222222-2222-2222-2222-222222222222"

    manual_cost_payload = {
        "company_id": test_company_id,
        "cost_category_id": test_category_id,
        "date": datetime.date.today().isoformat(),
        "amount": 123.45,
        "notes": "Test manual cost entry creation",
        "source": "manual"
    }

    # Create manual cost entry
    response = requests.post(
        f"{BASE_URL}/api/costs/manual",
        headers=headers,
        json=manual_cost_payload,
        timeout=TIMEOUT
    )
    assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}, content: {response.text}"

    # Retrieve cost entries with filters
    params = {"company_id": test_company_id}

    get_resp = requests.get(
        f"{BASE_URL}/api/costs/manual",
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        params=params,
        timeout=TIMEOUT
    )
    assert get_resp.status_code == 200, f"Expected 200 OK, got {get_resp.status_code}, content: {get_resp.text}"
    costs_list = get_resp.json()
    assert isinstance(costs_list, (list, dict)), "Response should be a list/dict of costs"

    # With category filter
    params_with_category = {"company_id": test_company_id, "category_id": test_category_id}
    get_resp_cat = requests.get(
        f"{BASE_URL}/api/costs/manual",
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        params=params_with_category,
        timeout=TIMEOUT
    )
    assert get_resp_cat.status_code == 200, f"Expected 200 OK for category filter, got {get_resp_cat.status_code}, content: {get_resp_cat.text}"

    # With date range filter
    start_date = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    end_date = datetime.date.today().isoformat()
    params_with_dates = {"company_id": test_company_id, "start_date": start_date, "end_date": end_date}
    get_resp_dates = requests.get(
        f"{BASE_URL}/api/costs/manual",
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        params=params_with_dates,
        timeout=TIMEOUT
    )
    assert get_resp_dates.status_code == 200, f"Expected 200 OK for date filter, got {get_resp_dates.status_code}, content: {get_resp_dates.text}"

    # With pagination
    params_with_pagination = {"company_id": test_company_id, "limit": 10, "offset": 0}
    get_resp_pagination = requests.get(
        f"{BASE_URL}/api/costs/manual",
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        params=params_with_pagination,
        timeout=TIMEOUT
    )
    assert get_resp_pagination.status_code == 200, f"Expected 200 OK for pagination, got {get_resp_pagination.status_code}, content: {get_resp_pagination.text}"

    # Test with wrong credentials (simulate unauthorized)
    wrong_login_resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json={"email": "invaliduser@example.com", "password": "wrongpass"},
        timeout=TIMEOUT
    )
    assert wrong_login_resp.status_code == 400 or wrong_login_resp.status_code == 401, f"Expected 400 or 401 for invalid login, got {wrong_login_resp.status_code}, content: {wrong_login_resp.text}"

    # If for some reason login succeeds (should not), try to use token and expect 401 or 403 on manual cost POST
    if wrong_login_resp.status_code == 200:
        wrong_token = wrong_login_resp.json().get('token', '')
        headers_wrong = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {wrong_token}"
        }
        resp_unauthorized = requests.post(
            f"{BASE_URL}/api/costs/manual",
            headers=headers_wrong,
            json=manual_cost_payload,
            timeout=TIMEOUT
        )
        assert resp_unauthorized.status_code == 401 or resp_unauthorized.status_code == 403, f"Expected 401 or 403 for unauthorized access, got {resp_unauthorized.status_code}"


test_manual_cost_entry_creation_and_retrieval()
