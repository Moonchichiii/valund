from decimal import Decimal
from .factories import (
    PaymentFactory,
    PaymentMethodFactory,
    EscrowAccountFactory,
    PaymentDisputeFactory,
    StripeWebhookEventFactory,
)


def test_payment_platform_fee_calculated(db):
    payment = PaymentFactory(platform_fee=Decimal("0.00"))
    payment.save()
    assert payment.platform_fee > 0


def test_payment_method_default_uniqueness(db):
    pm1 = PaymentMethodFactory()
    pm2 = PaymentMethodFactory(user=pm1.user, is_default=True)
    pm1.refresh_from_db()
    assert pm1.is_default is False
    assert pm2.is_default is True


def test_escrow_account_properties(db):
    escrow = EscrowAccountFactory()
    assert escrow.amount_remaining == escrow.amount_held - escrow.amount_released
    assert escrow.is_expired is True


def test_payment_dispute_str(db):
    dispute = PaymentDisputeFactory()
    assert dispute.payment.booking.title in str(dispute)


def test_stripe_webhook_event_str(db):
    evt = StripeWebhookEventFactory()
    assert evt.event_type in str(evt)
