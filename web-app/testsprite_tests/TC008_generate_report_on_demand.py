import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
REPORT_RUN_ENDPOINT = f"{BASE_URL}/api/reports/run"

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

TIMEOUT = 30

def test_generate_report_on_demand():
    # Step 1: Login to obtain auth token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = requests.post(
            LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token found in login response"
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    # Prepare headers with Bearer token
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # For the test, define some sample report_type and company_id
    # Because they are required, but not given, we create a dummy sample
    # We choose 'summary' as report_type and some UUID as company_id

    # If these need to be dynamic or created, in real scenario we would create a company and report type,
    # but here assuming static known values for the test.

    sample_company_id = "00000000-0000-0000-0000-000000000001"
    sample_report_type = "summary"

    # Test all allowed formats
    for fmt in ["pdf", "excel", "csv"]:
        payload = {
            "report_type": sample_report_type,
            "company_id": sample_company_id,
            "format": fmt
        }
        try:
            resp = requests.post(
                REPORT_RUN_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=TIMEOUT
            )
            assert resp.status_code == 200, f"Report generation failed for format {fmt} with status {resp.status_code}"
            # Optionally check that response content is not empty (report generated)
            content = resp.content
            assert content, f"Empty response content for report format {fmt}"
        except Exception as e:
            raise AssertionError(f"Report generation request failed for format {fmt}: {e}")

test_generate_report_on_demand()