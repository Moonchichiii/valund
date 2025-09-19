import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from .models import BankIDSession

pytestmark = pytest.mark.django_db


def test_oauth_exchange_google():
    client = APIClient()
    url = reverse("identity:oauth-exchange")
    resp = client.post(url, {"provider": "google", "code": "abc123code"})
    assert resp.status_code == 200
    data = resp.json()
    assert "tokens" in data and "user_id" in data


def test_oauth_exchange_unsupported():
    client = APIClient()
    url = reverse("identity:oauth-exchange")
    resp = client.post(url, {"provider": "twitter", "code": "x"})
    assert resp.status_code == 400


def test_bankid_flow():
    client = APIClient()
    start_url = reverse("identity:bankid-start")
    start_resp = client.post(start_url, {"personal_number": "199001011234"})
    assert start_resp.status_code == 200
    order_ref = start_resp.json()["order_ref"]

    status_url = reverse("identity:bankid-status", args=[order_ref])
    status_resp = client.get(status_url)
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] == BankIDSession.STATUS_COMPLETE
    assert "tokens" in data
