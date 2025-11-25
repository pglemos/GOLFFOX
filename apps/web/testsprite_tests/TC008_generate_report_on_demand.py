import requests

def test_generate_report_on_demand():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/reports/run"
    headers = {
        "Content-Type": "application/json"
    }
    # Example valid report types and a dummy company_id for testing
    report_types = ["daily-summary", "fleet-performance", "cost-analysis"]
    formats = ["pdf", "excel", "csv"]
    company_id = "00000000-0000-0000-0000-000000000001"

    for report_type in report_types:
        for fmt in formats:
            payload = {
                "report_type": report_type,
                "company_id": company_id,
                "format": fmt
            }
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=30)
            except requests.RequestException as e:
                assert False, f"Request failed: {e}"
            assert response.status_code == 200, f"Expected HTTP 200, got {response.status_code} for report_type: {report_type}, format: {fmt}"
            # For a report generated response, content-type might be application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, or text/csv
            content_type = response.headers.get("Content-Type", "")
            if fmt == "pdf":
                assert "pdf" in content_type.lower(), f"Expected PDF content type for format pdf, got {content_type}"
            elif fmt == "excel":
                # Check for Excel MIME types
                assert ("spreadsheetml" in content_type.lower() or "excel" in content_type.lower()), f"Expected Excel content type for format excel, got {content_type}"
            elif fmt == "csv":
                assert "csv" in content_type.lower() or "text/plain" in content_type.lower(), f"Expected CSV content type for format csv, got {content_type}"
            # Assert some content is returned
            assert response.content is not None and len(response.content) > 0, f"Empty content for report_type: {report_type}, format: {fmt}"


test_generate_report_on_demand()