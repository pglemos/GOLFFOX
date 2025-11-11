import requests

def test_verify_kpis_refresh_cron_job():
    base_url = "http://localhost:3000"
    endpoint = "/api/cron/refresh-kpis"
    url = f"{base_url}{endpoint}"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        # The response body might be empty or contain confirmation text, so just check content type if present
        content_type = response.headers.get("Content-Type", "")
        assert "application/json" in content_type or "text" in content_type or content_type == "", \
            f"Unexpected content type: {content_type}"
    except requests.RequestException as e:
        assert False, f"Request to refresh KPIs cron job failed with exception: {e}"

test_verify_kpis_refresh_cron_job()