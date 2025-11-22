import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
REPORT_RUN_URL = f"{BASE_URL}/api/reports/run"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"
TIMEOUT = 30

def get_auth_token():
    try:
        response = requests.post(
            LOGIN_URL,
            json={"email": USERNAME, "password": PASSWORD},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        if not token:
            raise ValueError("No auth token returned in login response")
        return token
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

def test_generate_report_on_demand():
    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # We need valid report_type and company_id - since not provided,
    # typically the test must create or obtain these.
    # Here we assume minimal sample placeholder values:
    report_type = "summary"   # Assuming "summary" is a valid report_type
    company_id = "00000000-0000-0000-0000-000000000001"  # Placeholder UUID

    formats = ["pdf", "excel", "csv"]

    for fmt in formats:
        payload = {
            "report_type": report_type,
            "company_id": company_id,
            "format": fmt
        }
        try:
            response = requests.post(REPORT_RUN_URL, json=payload, headers=headers, timeout=TIMEOUT)
            response.raise_for_status()
            # Response code 200 indicates report generated successfully
            assert response.status_code == 200
            # Content-Type can vary but typically should reflect the format; we check presence of data
            assert response.content is not None and len(response.content) > 0
        except requests.RequestException as e:
            raise AssertionError(f"Request failed for format '{fmt}': {e}")
        except AssertionError as ae:
            raise AssertionError(f"Assertion failed for format '{fmt}': {ae}")

test_generate_report_on_demand()