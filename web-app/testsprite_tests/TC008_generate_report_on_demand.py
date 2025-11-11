import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
REPORT_RUN_URL = f"{BASE_URL}/api/reports/run"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

TIMEOUT = 30

def test_generate_report_on_demand():
    # Step 1: Authenticate and obtain token for bearer auth
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Authentication token missing in login response"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authentication failed: {str(e)}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Prepare test data for report generation
    # We need valid report_type and company_id, since these are not provided explicitly,
    # we will use fixed dummy values.
    # report_type: string, company_id: string
    # For coverage, test each format: pdf, excel, csv.
    test_report_type = "monthly_summary"
    test_company_id = "00000000-0000-0000-0000-000000000001"
    formats = ["pdf", "excel", "csv"]

    for fmt in formats:
        payload = {
            "report_type": test_report_type,
            "company_id": test_company_id,
            "format": fmt
        }
        try:
            resp = requests.post(REPORT_RUN_URL, headers=headers, json=payload, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Report generation failed for format '{fmt}' with status {resp.status_code}"
            # Additional validation can be done if response content-type or response body format is known
            # For now, just check content type and non-empty content
            content = resp.content
            assert content and len(content) > 0, f"Empty report content for format '{fmt}'"
        except (requests.RequestException, AssertionError) as e:
            raise AssertionError(f"Test failed for format '{fmt}': {str(e)}")

test_generate_report_on_demand()