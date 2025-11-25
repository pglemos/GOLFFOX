import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
REPORT_RUN_ENDPOINT = "/api/reports/run"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"

def test_generate_report_on_demand():
    session = requests.Session()
    try:
        # Step 1: Authenticate and get token
        login_resp = session.post(
            BASE_URL + LOGIN_ENDPOINT,
            json={"email": USERNAME, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token missing or invalid in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # We need valid report_type and company_id
        # Since these are not provided by the test plan or PRD, 
        # we will attempt to create a placeholder report_type and company_id.
        # But datamodel is absent, so we test with dummy values.
        # Testing multiple formats as per test description

        report_type = "fleet_summary"
        company_id = "00000000-0000-0000-0000-000000000001"  # Dummy UUID for test

        formats = ["pdf", "excel", "csv"]

        for fmt in formats:
            payload = {
                "report_type": report_type,
                "company_id": company_id,
                "format": fmt
            }
            resp = session.post(
                BASE_URL + REPORT_RUN_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=TIMEOUT
            )
            assert resp.status_code == 200, f"Report generation failed for format {fmt} with status {resp.status_code}"

            # Verify response content type matches expected report output type if any
            # Since API doc doesn't specify content type, just check non-empty content
            assert resp.content, f"Empty response content for format {fmt}"

    finally:
        session.close()

test_generate_report_on_demand()