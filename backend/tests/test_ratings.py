import pytest
from ratings.models import Rating
from .factories import (
    RatingFactory,
    RatingStatisticsFactory,
    RatingFlagFactory,
    BookingFactory,
)


def test_rating_uniqueness(db):
    rating = RatingFactory()
    with pytest.raises(Exception):
        Rating.objects.create(
            booking=rating.booking,
            rater=rating.rater,
            rated_user=rating.rated_user,
            rater_type=rating.rater_type,
            overall_rating=5,
            review_text="Dup",
        )


def test_rating_statistics_update(db):
    rating1 = RatingFactory(overall_rating=4)
    booking2 = BookingFactory(
        client=rating1.booking.client, freelancer=rating1.rated_user
    )
    RatingFactory(
        booking=booking2,
        rater=booking2.client,
        rated_user=rating1.rated_user,
        rater_type=Rating.RaterType.CLIENT,
        overall_rating=5,
        review_text="Another",
    )
    stats_factory = RatingStatisticsFactory(user=rating1.rated_user)
    stats_factory.update_statistics()
    stats_factory.refresh_from_db()
    assert stats_factory.total_ratings >= 1
    assert stats_factory.average_rating >= 0


def test_rating_flag_uniqueness_and_str(db):
    flag = RatingFlagFactory()
    assert flag.get_reason_display().split()[0] in str(flag)
    with pytest.raises(Exception):
        RatingFlagFactory(rating=flag.rating, flagger=flag.flagger)
