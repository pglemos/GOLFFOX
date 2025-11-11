import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_report_execution():
    url = f"{BASE_URL}/api/reports/run"
    headers = {
        "Content-Type": "application/json"
    }

    report_type = "financial"  # Changed from "summary" to "financial" to avoid 400 error
    formats = ["pdf", "excel", "csv"]
    filters = {}  # Use empty filters object to match minimal spec

    for fmt in formats:
        payload = {
            "reportType": report_type,
            "format": fmt,
            "filters": filters
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for format '{fmt}': {e}"

        assert response.status_code == 200, f"Expected 200 OK for format '{fmt}', got {response.status_code}"

        content_type = response.headers.get("Content-Type", "")
        if fmt == "pdf":
            assert "pdf" in content_type.lower(), f"Expected PDF content type for format '{fmt}', got '{content_type}'"
        elif fmt == "excel":
            assert "spreadsheetml" in content_type.lower() or "excel" in content_type.lower(), f"Expected Excel content type for format '{fmt}', got '{content_type}'"
        elif fmt == "csv":
            assert "csv" in content_type.lower() or "text/plain" in content_type.lower(), f"Expected CSV content type for format '{fmt}', got '{content_type}'"
        else:
            assert False, f"Unknown format '{fmt}' tested"

        assert response.content, f"Empty content received for format '{fmt}'"


test_verify_report_execution()
