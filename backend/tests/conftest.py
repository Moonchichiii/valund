import pytest
from django.test import Client

from .factories import (
    UserFactory,
    ClientFactory,
    ProfileFactory,
    SkillFactory,
    BookingFactory,
    PaymentFactory,
)


@pytest.fixture
def api_client():
    return Client()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def client_user():
    return ClientFactory()


@pytest.fixture
def profile(user):
    return ProfileFactory(user=user)


@pytest.fixture
def skill():
    return SkillFactory()


@pytest.fixture
def booking():
    return BookingFactory()


@pytest.fixture
def payment():
    return PaymentFactory()
