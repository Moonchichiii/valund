import pytest

pytestmark = pytest.mark.django_db


def test_metrics_endpoint_exposes_basic_metrics(client):
    # Use Django test client directly for plain text endpoint
    response = client.get("/metrics/")
    assert response.status_code == 200
    body = response.content.decode("utf-8")
    # Check a couple of expected metric name fragments
    assert "django_http_requests_total" in body
    assert "process_resident_memory_bytes" in body
