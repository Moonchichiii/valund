import pytest
from accounts.models import UserSkill
from django.db import IntegrityError

from .factories import ProfileFactory, SkillFactory, UserFactory, UserSkillFactory


@pytest.mark.django_db
def test_user_full_name_property():
    user = UserFactory(first_name="Jane", last_name="Doe")
    assert user.full_name == "Jane Doe"


@pytest.mark.django_db
def test_profile_str():
    profile = ProfileFactory()
    assert str(profile).endswith("'s Profile")


@pytest.mark.django_db
def test_skill_ordering():
    s1 = SkillFactory(category="A")
    s2 = SkillFactory(category="B")
    ordered = list(type(s1).objects.all())
    assert s1 in ordered and s2 in ordered


@pytest.mark.django_db
def test_user_skill_uniqueness():
    user_skill = UserSkillFactory()
    with pytest.raises(IntegrityError):
        UserSkill.objects.create(user=user_skill.user, skill=user_skill.skill)


@pytest.mark.django_db
def test_user_skill_str():
    us = UserSkillFactory()
    assert us.skill.name in str(us)
