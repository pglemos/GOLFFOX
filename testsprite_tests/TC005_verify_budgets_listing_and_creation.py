import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Add test user credentials for login
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testpassword"

def test_verify_budgets_listing_and_creation():
    session = requests.Session()

    # First, authenticate to get bearer token
    login_payload = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }

    try:
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert "token" in login_json, "Login response missing token"
        token = login_json["token"]
    except Exception as e:
        raise AssertionError(f"Authentication failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. GET /api/costs/budgets to list budgets
    try:
        get_resp = session.get(f"{BASE_URL}/api/costs/budgets", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 for GET budgets, got {get_resp.status_code}"
        budgets_list = get_resp.json()
        assert isinstance(budgets_list, list), "Expected response to be a list for budgets"
    except Exception as e:
        raise AssertionError(f"GET /api/costs/budgets request failed: {e}")

    # 2. POST /api/costs/budgets to create a new budget with valid data
    new_budget = {
        "name": "Test Budget",
        "amount": 10000.00,
        "period": "2025-12"
    }

    created_budget_id = None
    try:
        post_resp = session.post(f"{BASE_URL}/api/costs/budgets", json=new_budget, headers=headers, timeout=TIMEOUT)
        assert post_resp.status_code == 201, f"Expected 201 for POST create budget, got {post_resp.status_code}"

        try:
            created_budget = post_resp.json()
            if isinstance(created_budget, dict) and "id" in created_budget:
                created_budget_id = created_budget["id"]
        except Exception:
            pass

        if post_resp.headers.get("Content-Type", "").startswith("application/json"):
            assert "name" in created_budget and created_budget["name"] == new_budget["name"], "Created budget name mismatch"
    except Exception as e:
        raise AssertionError(f"POST /api/costs/budgets request failed: {e}")

    # Cleanup: if created_budget_id is available, attempt to delete the created budget to avoid leftover test data
    if created_budget_id:
        try:
            delete_resp = session.delete(f"{BASE_URL}/api/costs/budgets/{created_budget_id}", headers=headers, timeout=TIMEOUT)
            assert delete_resp.status_code in (200, 204), f"Failed to delete test budget, status {delete_resp.status_code}"
        except Exception as e:
            raise AssertionError(f"Cleanup DELETE /api/costs/budgets/{created_budget_id} failed: {e}")

test_verify_budgets_listing_and_creation()
