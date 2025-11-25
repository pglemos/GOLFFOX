import requests

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "golffox@admin.com"
AUTH_PASSWORD = "senha123"
TIMEOUT = 30

def test_generate_report_on_demand():
    url = f"{BASE_URL}/api/reports/run"
    headers = {
        "Content-Type": "application/json"
    }

    # Sample valid payloads with hypothetical report_type and company_id
    valid_report_types = ["monthly_summary", "daily_summary", "usage_report"]
    company_id = "00000000-0000-0000-0000-000000000001"

    formats = ["pdf", "excel", "csv"]

    for fmt in formats:
        for report_type in valid_report_types:
            payload = {
                "report_type": report_type,
                "company_id": company_id,
                "format": fmt
            }
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
            except requests.RequestException as e:
                assert False, f"Request failed for format {fmt} and report_type {report_type}: {e}"

            # Validate successful response
            assert response.status_code == 200, f"Expected 200 OK, got {response.status_code} for format {fmt} and report_type {report_type}"

            # Do not attempt to parse JSON since API may not return JSON body



test_generate_report_on_demand()
