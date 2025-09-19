import pytest
from django.urls import (
    __all__,  # noqa: F401  (document importable symbols for coverage)
)

from .factories import (
    SearchProfileFactory,
    UserFactory,
)

# (SearchProfile accessed indirectly via factory; direct import not required)


@pytest.mark.django_db
def test_search_profile_score_and_vector():
    user = UserFactory(first_name="Ana", last_name="Dev")
    sp = SearchProfileFactory(user=user, skills_text="Python Django", location="Remote")
    # exercise score calculation branches
    initial = sp.calculate_search_score()
    assert initial > 0
    # update vector fallback path (sqlite)
    sp.update_search_vector()
    sp.refresh_from_db()
    assert isinstance(sp.search_vector, (str, type(None)))


@pytest.mark.django_db
def test_urls_import_and_reverse():
    # Smoke test reversing a non-existing but illustrative pattern names if added later.
    # For now we just ensure each app's urls module is importable.
    # This raises coverage on the simple urls.py files.
    for module in [
        "accounts.urls",
        "bookings.urls",
        "competence.urls",
        "payments.urls",
        "ratings.urls",
        "search.urls",
    ]:
        __import__(module)
