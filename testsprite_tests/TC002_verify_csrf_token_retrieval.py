import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_csrf_token_retrieval():
    url = f"{BASE_URL}/api/auth/csrf"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {str(e)}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "csrfToken" in data, "Response JSON does not contain 'csrfToken'"
    assert isinstance(data["csrfToken"], str), "'csrfToken' is not a string"
    assert len(data["csrfToken"]) > 0, "'csrfToken' is an empty string"


test_verify_csrf_token_retrieval()