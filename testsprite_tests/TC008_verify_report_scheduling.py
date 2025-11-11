import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_report_scheduling():
    url = f"{BASE_URL}/api/reports/schedule"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "reportType": "summary",
        "schedule": "0 9 * * 1",  # Every Monday at 09:00 AM (cron format)
        "recipients": [
            "manager@golffox.com",
            "admin@golffox.com"
        ]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)

        # Assert that the scheduling was successful
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        try:
            data = response.json()
        except Exception:
            data = None

    except requests.RequestException as e:
        assert False, f"Request to schedule report failed: {e}"

test_verify_report_scheduling()
