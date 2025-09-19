from decimal import Decimal
from django.utils import timezone
from ratings.models import RatingStatistics
from .factories import (
    ClientFactory,
    UserFactory,
    SkillFactory,
    BookingFactory,
    PaymentFactory,
    EscrowAccountFactory,
    RatingFactory,
    SearchProfileFactory,
)


def test_end_to_end_flow(db):
    client_user = ClientFactory()
    freelancer = UserFactory()
    skill = SkillFactory()
    booking = BookingFactory(
        client=client_user, freelancer=freelancer, skills_required=[skill]
    )

    payment = PaymentFactory(
        booking=booking, payer=client_user, payee=freelancer, amount=Decimal("300.00")
    )
    escrow = EscrowAccountFactory(
        booking=booking,
        payment=payment,
        amount_held=Decimal("300.00"),
        amount_released=Decimal("0.00"),
        auto_release_date=timezone.now() - timezone.timedelta(days=1),
    )
    assert escrow.is_expired is True

    RatingFactory(booking=booking, rater=client_user, rated_user=freelancer)
    stats, _ = RatingStatistics.objects.get_or_create(user=freelancer)
    stats.update_statistics()
    stats.refresh_from_db()
    assert stats.total_ratings >= 1

    sp = SearchProfileFactory(
        user=freelancer,
        total_ratings=stats.total_ratings,
        average_rating=stats.average_rating,
    )
    sp.update_search_vector()
    sp.calculate_search_score()
    sp.refresh_from_db()
    assert sp.search_score > 0
