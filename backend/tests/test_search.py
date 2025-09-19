import pytest
from django.db import IntegrityError
from .factories import (
    SearchProfileFactory,
    SkillCategoryFactory,
    PopularSearchFactory,
    SavedSearchFactory,
)
from search.models import SavedSearch


def test_search_profile_scoring_and_vector(db):
    sp = SearchProfileFactory()
    sp.update_search_vector()
    score = sp.calculate_search_score()
    assert score > 0
    sp.refresh_from_db()
    assert sp.search_score == score


def test_skill_category_hierarchy(db):
    parent = SkillCategoryFactory(name="Parent", slug="parent")
    child = SkillCategoryFactory(name="Child", slug="child", parent=parent)
    assert "→" in str(child)


def test_popular_search_increment(db):
    ps = PopularSearchFactory()
    ps.search_count += 1
    ps.save()
    assert ps.search_count >= 2


def test_saved_search_uniqueness(db):
    ss = SavedSearchFactory(name="My Search")
    with pytest.raises(IntegrityError):
        SavedSearch.objects.create(
            user=ss.user, name="My Search", query="x", filters={}
        )
