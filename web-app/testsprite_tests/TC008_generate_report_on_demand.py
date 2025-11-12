import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
REPORT_RUN_URL = f"{BASE_URL}/api/reports/run"

AUTH_CREDENTIALS = {
    "username": "golffox@admin.com",
    "password": "senha123"
}

TIMEOUT = 30

def test_generate_report_on_demand():
    session = requests.Session()

    # Step 1: Login to obtain auth token (Bearer token assumed for Authorization)
    login_payload = {
        "email": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }

    try:
        login_resp = session.post(
            LOGIN_URL,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "token" in login_data, "Login response missing token"
        token = login_data["token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authentication failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Use a valid report_type as per the API specification
    report_type = "delays"
    company_id = "00000000-0000-0000-0000-000000000001"  # Example UUID; replace with valid company_id

    formats = ["pdf", "excel", "csv"]

    for fmt in formats:
        payload = {
            "report_type": report_type,
            "company_id": company_id,
            "format": fmt
        }
        try:
            response = session.post(
                REPORT_RUN_URL,
                headers=headers,
                json=payload,
                timeout=TIMEOUT
            )
            assert response.status_code == 200, (
                f"Report generation failed for format '{fmt}' with status {response.status_code} and response {response.text}"
            )
            # Additional checks can be format specific, e.g. content-type or content disposition,
            # but not specified in PRD, so just ensure success here.
            # Check presence of content in response (assuming binary or json report data)
            assert response.content, f"Empty response content for format '{fmt}'"
        except (requests.RequestException, AssertionError) as e:
            raise AssertionError(f"Report generation failed for format '{fmt}': {e}")

test_generate_report_on_demand()
