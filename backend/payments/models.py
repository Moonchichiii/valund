"""
Payment and escrow models for handling financial transactions.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Payment(models.Model):
    """Payment record for bookings"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')
    
    class PaymentType(models.TextChoices):
        ESCROW = 'escrow', _('Escrow Payment')
        DIRECT = 'direct', _('Direct Payment')
        REFUND = 'refund', _('Refund')
        MILESTONE = 'milestone', _('Milestone Payment')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    # Payment parties
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments_made'
    )
    payee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments_received'
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='USD')
    
    payment_type = models.CharField(
        max_length=10,
        choices=PaymentType.choices,
        default=PaymentType.ESCROW
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Stripe integration
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    stripe_transfer_id = models.CharField(max_length=255, blank=True)
    
    # Platform fee
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    platform_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('5.00')
    )
    
    # Metadata
    description = models.CharField(max_length=500)
    metadata = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment'
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['payer', 'status']),
            models.Index(fields=['payee', 'status']),
            models.Index(fields=['booking', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.amount} {self.currency} - {self.booking.title}"
    
    def save(self, *args, **kwargs):
        """Calculate platform fee on save"""
        if not self.platform_fee and self.amount:
            self.platform_fee = (self.amount * self.platform_fee_percentage / 100).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)


class EscrowAccount(models.Model):
    """Escrow account for holding funds during booking"""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        RELEASED = 'released', _('Released')
        REFUNDED = 'refunded', _('Refunded')
        DISPUTED = 'disputed', _('Disputed')
        EXPIRED = 'expired', _('Expired')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='escrow_account'
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='escrow_accounts'
    )
    
    # Escrow details
    amount_held = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    amount_released = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    currency = models.CharField(max_length=3, default='USD')
    
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Release conditions
    auto_release_date = models.DateTimeField(
        help_text='Date when funds will be automatically released'
    )
    requires_approval = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'escrow_account'
        verbose_name = _('Escrow Account')
        verbose_name_plural = _('Escrow Accounts')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Escrow {self.amount_held} {self.currency} - {self.booking.title}"
    
    @property
    def amount_remaining(self):
        """Calculate remaining amount in escrow"""
        return self.amount_held - self.amount_released
    
    @property
    def is_expired(self):
        """Check if escrow has expired"""
        return timezone.now() > self.auto_release_date and self.status == self.Status.ACTIVE


class PaymentDispute(models.Model):
    """Dispute resolution for payments"""
    
    class Status(models.TextChoices):
        OPEN = 'open', _('Open')
        UNDER_REVIEW = 'under_review', _('Under Review')
        RESOLVED = 'resolved', _('Resolved')
        CLOSED = 'closed', _('Closed')
    
    class DisputeType(models.TextChoices):
        WORK_NOT_COMPLETED = 'work_not_completed', _('Work Not Completed')
        POOR_QUALITY = 'poor_quality', _('Poor Quality Work')
        LATE_DELIVERY = 'late_delivery', _('Late Delivery')
        OVERCHARGED = 'overcharged', _('Overcharged')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='disputes'
    )
    escrow_account = models.ForeignKey(
        EscrowAccount,
        on_delete=models.CASCADE,
        related_name='disputes',
        null=True,
        blank=True
    )
    
    # Dispute details
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='disputes_raised'
    )
    dispute_type = models.CharField(
        max_length=20,
        choices=DisputeType.choices
    )
    description = models.TextField()
    
    # Evidence
    evidence_files = models.JSONField(default=list)
    
    # Resolution
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.OPEN
    )
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disputes_resolved'
    )
    
    # Financial resolution
    refund_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    release_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_dispute'
        verbose_name = _('Payment Dispute')
        verbose_name_plural = _('Payment Disputes')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dispute - {self.payment.booking.title} ({self.get_status_display()})"


class PaymentMethod(models.Model):
    """Stored payment methods for users"""
    
    class MethodType(models.TextChoices):
        CARD = 'card', _('Credit/Debit Card')
        BANK = 'bank', _('Bank Account')
        PAYPAL = 'paypal', _('PayPal')
        CRYPTO = 'crypto', _('Cryptocurrency')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
    
    # Method details
    method_type = models.CharField(
        max_length=10,
        choices=MethodType.choices
    )
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Stripe integration
    stripe_payment_method_id = models.CharField(max_length=255, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    
    # Displayed information (last 4 digits, etc.)
    display_name = models.CharField(max_length=100)
    last_four = models.CharField(max_length=4, blank=True)
    brand = models.CharField(max_length=50, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_method'
        verbose_name = _('Payment Method')
        verbose_name_plural = _('Payment Methods')
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.display_name} - {self.user.full_name}"
    
    def save(self, *args, **kwargs):
        """Ensure only one default payment method per user"""
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)


class StripeWebhookEvent(models.Model):
    """Log of Stripe webhook events for debugging and audit"""
    
    stripe_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    processed = models.BooleanField(default=False)
    
    # Event data
    data = models.JSONField()
    
    # Processing results
    processing_error = models.TextField(blank=True)
    processing_attempts = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'stripe_webhook_event'
        verbose_name = _('Stripe Webhook Event')
        verbose_name_plural = _('Stripe Webhook Events')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} - {self.stripe_id}"
