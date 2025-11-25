import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
REPORT_RUN_URL = f"{BASE_URL}/api/reports/run"
TIMEOUT = 30

USERNAME = "golffox@admin.com"
PASSWORD = "senha123"


def test_generate_report_on_demand():
    # Authenticate and get token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_response = requests.post(
            LOGIN_URL,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token not found in login response"
    except Exception as e:
        raise AssertionError(f"Authentication request failed: {e}")

    # We need company_id and report_type for the report generation
    # Since not provided, make a dynamic assumption:
    # For this test, let's create a dummy report_type and company_id placeholders.
    # If no company_id known, we try to infer from login user info, else skip test fail
    company_id = None
    user_info = login_data.get("user", {})
    if isinstance(user_info, dict):
        # Attempt to get company_id from user info if available
        company_id = user_info.get("company_id")

    # If company_id not found, cannot proceed
    assert company_id is not None, "company_id not found in user info; cannot run report test"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    report_types = ["fleet_status", "cost_summary", "driver_performance"]
    formats = ["pdf", "excel", "csv"]

    # Run report generation for each format and report_type combination
    for report_type in report_types:
        for fmt in formats:
            payload = {
                "report_type": report_type,
                "company_id": company_id,
                "format": fmt
            }
            try:
                response = requests.post(
                    REPORT_RUN_URL,
                    json=payload,
                    headers=headers,
                    timeout=TIMEOUT
                )
                assert response.status_code == 200, (
                    f"Report generation failed for type={report_type}, format={fmt}, "
                    f"status_code={response.status_code}, response={response.text}"
                )
                # Optionally check content-type for different formats
                content_type = response.headers.get("Content-Type", "")
                if fmt == "pdf":
                    assert "pdf" in content_type.lower(), f"Expected PDF content type, got: {content_type}"
                elif fmt == "excel":
                    assert any(x in content_type.lower() for x in ["excel", "spreadsheet", "sheet"]), f"Expected Excel content type, got: {content_type}"
                elif fmt == "csv":
                    assert "csv" in content_type.lower(), f"Expected CSV content type, got: {content_type}"
            except Exception as e:
                raise AssertionError(f"Report generation request failed for type={report_type}, format={fmt}: {e}")


test_generate_report_on_demand()
