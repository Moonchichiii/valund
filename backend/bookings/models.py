"""
Booking models for managing freelancer-client engagements.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Booking(models.Model):
    """Main booking model for freelancer-client engagements"""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        ACCEPTED = "accepted", _("Accepted")
        IN_PROGRESS = "in_progress", _("In Progress")
        COMPLETED = "completed", _("Completed")
        CANCELLED = "cancelled", _("Cancelled")
        DISPUTED = "disputed", _("Disputed")

    class Priority(models.TextChoices):
        LOW = "low", _("Low")
        MEDIUM = "medium", _("Medium")
        HIGH = "high", _("High")
        URGENT = "urgent", _("Urgent")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Parties involved
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_bookings",
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="freelancer_bookings",
    )

    # Booking details
    title = models.CharField(max_length=200)
    description = models.TextField()
    skills_required = models.ManyToManyField(
        "accounts.Skill", related_name="required_bookings"
    )

    # Timing
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    estimated_hours = models.DecimalField(
        max_digits=6, decimal_places=2, validators=[MinValueValidator(Decimal("0.5"))]
    )

    # Pricing
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    total_budget = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )

    # Status and priority
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )

    # Locations
    is_remote = models.BooleanField(default=True)
    location = models.CharField(max_length=200, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "booking"
        verbose_name = _("Booking")
        verbose_name_plural = _("Bookings")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "start_date"]),
            models.Index(fields=["freelancer", "status"]),
            models.Index(fields=["client", "status"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.client.full_name} → {self.freelancer.full_name}"

    @property
    def is_active(self):
        """Check if booking is currently active"""
        return self.status in [self.Status.ACCEPTED, self.Status.IN_PROGRESS]

    @property
    def is_overdue(self):
        """Check if booking is overdue"""
        return self.end_date < timezone.now() and self.status != self.Status.COMPLETED


class TimeLog(models.Model):
    """Time tracking for bookings"""

    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        SUBMITTED = "submitted", _("Submitted")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="time_logs"
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_logs"
    )

    # Time tracking
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hours_worked = models.DecimalField(
        max_digits=4, decimal_places=2, validators=[MinValueValidator(Decimal("0.1"))]
    )

    # Description of work
    description = models.TextField()
    tasks_completed = models.JSONField(default=list)

    # Approval workflow
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "time_log"
        verbose_name = _("Time Log")
        verbose_name_plural = _("Time Logs")
        ordering = ["-date", "-start_time"]
        unique_together = ["booking", "freelancer", "date", "start_time"]

    def __str__(self):
        return f"{self.date} - {self.hours_worked}h - {self.booking.title}"

    def clean(self):
        """Validate time log data"""
        from django.core.exceptions import ValidationError

        if self.start_time and self.end_time:
            # Calculate hours worked
            start_datetime = timezone.datetime.combine(self.date, self.start_time)
            end_datetime = timezone.datetime.combine(self.date, self.end_time)

            if end_datetime <= start_datetime:
                raise ValidationError("End time must be after start time")

            # Calculate hours
            duration = end_datetime - start_datetime
            calculated_hours = Decimal(str(duration.total_seconds() / 3600))

            # Allow small rounding differences
            if abs(calculated_hours - self.hours_worked) > Decimal("0.1"):
                self.hours_worked = calculated_hours.quantize(Decimal("0.01"))


class BookingApproval(models.Model):
    """Approval workflow for booking status changes"""

    class ApprovalType(models.TextChoices):
        BOOKING_ACCEPTANCE = "booking_acceptance", _("Booking Acceptance")
        COMPLETION = "completion", _("Completion")
        CANCELLATION = "cancellation", _("Cancellation")
        TIME_LOG = "time_log", _("Time Log")
        PAYMENT_RELEASE = "payment_release", _("Payment Release")

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="approvals"
    )

    # Approval details
    approval_type = models.CharField(max_length=20, choices=ApprovalType.choices)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_requests",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approvals_given",
        null=True,
        blank=True,
    )

    # Request and response
    request_message = models.TextField()
    response_message = models.TextField(blank=True)

    # Status
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    # Related objects
    time_log = models.ForeignKey(
        TimeLog,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="approvals",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "booking_approval"
        verbose_name = _("Booking Approval")
        verbose_name_plural = _("Booking Approvals")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_approval_type_display()} - {self.booking.title}"


class BookingAttachment(models.Model):
    """File attachments for bookings"""

    def booking_attachment_path(instance, filename):
        return f"bookings/{instance.booking.id}/attachments/{filename}"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="attachments"
    )
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    file = models.FileField(upload_to=booking_attachment_path)
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100)

    description = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_attachment"
        verbose_name = _("Booking Attachment")
        verbose_name_plural = _("Booking Attachments")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.filename} - {self.booking.title}"
