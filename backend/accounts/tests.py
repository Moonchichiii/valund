import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def get_tokens(client: APIClient, username: str, password: str):
    resp = client.post(reverse('accounts:token_obtain_pair'), {
        'username': username,
        'password': password,
    })
    assert resp.status_code == 200
    return resp.json()


def test_me_and_logout():
    User = get_user_model()
    User.objects.create_user(username='alice', password='secret', email='alice@example.com')
    client = APIClient()
    tokens = get_tokens(client, 'alice', 'secret')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    me_url = reverse('accounts:me')
    me_resp = client.get(me_url)
    assert me_resp.status_code == 200
    assert me_resp.json()['username'] == 'alice'

    logout_url = reverse('accounts:logout')
    out_resp = client.post(logout_url)
    assert out_resp.status_code == 200
