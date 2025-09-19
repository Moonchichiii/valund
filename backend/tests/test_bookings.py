import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone
from .factories import (
    BookingFactory,
    TimeLogFactory,
    BookingAttachmentFactory,
    BookingApprovalFactory,
)


def test_booking_properties_active_and_overdue(db):
    booking = BookingFactory()
    assert booking.is_active is False  # initial status pending
    booking.status = booking.Status.ACCEPTED
    assert booking.is_active is True
    booking.end_date = timezone.now() - timezone.timedelta(days=1)
    booking.status = booking.Status.IN_PROGRESS
    assert booking.is_overdue is True


def test_time_log_clean_adjusts_hours(db):
    tl = TimeLogFactory(hours_worked=Decimal("1.00"))
    tl.clean()
    assert tl.hours_worked != Decimal("1.00")


def test_time_log_clean_invalid_times(db):
    tl = TimeLogFactory()
    tl.end_time = tl.start_time
    with pytest.raises(ValidationError):
        tl.clean()


def test_booking_attachment_str(db):
    att = BookingAttachmentFactory()
    assert att.filename in str(att)


def test_booking_approval_str(db):
    approval = BookingApprovalFactory()
    assert approval.booking.title in str(approval)
