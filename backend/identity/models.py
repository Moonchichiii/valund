import hashlib

from django.conf import settings
from django.db import models
from django.utils import timezone


class UserIdentity(models.Model):
    SCHEME_PERSONAL_NUMBER = "pn"
    SCHEME_CHOICES = [
        (SCHEME_PERSONAL_NUMBER, "Personal Number"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="identities"
    )
    scheme = models.CharField(max_length=10, choices=SCHEME_CHOICES)
    identity_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("scheme", "identity_hash")

    def __str__(self):
        return f"{self.user_id}:{self.scheme}:{self.identity_hash[:12]}"

    @staticmethod
    def hash_personal_number(personal_number: str) -> str:
        return hashlib.sha256(personal_number.strip().encode("utf-8")).hexdigest()


class SocialAccountLink(models.Model):
    PROVIDER_GOOGLE = "google"
    PROVIDER_GITHUB = "github"
    PROVIDER_CHOICES = [
        (PROVIDER_GOOGLE, "Google"),
        (PROVIDER_GITHUB, "GitHub"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="social_links"
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=191)
    email = models.EmailField()
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("provider", "provider_user_id")

    def __str__(self):
        return f"{self.provider}:{self.provider_user_id} -> {self.user_id}"


class BankIDSession(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETE = "complete"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETE, "Complete"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    order_ref = models.CharField(max_length=64, unique=True)
    auto_start_token = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    personal_number_hash = models.CharField(max_length=128, blank=True, null=True)
    completion_data = models.JSONField(blank=True, null=True)
    failure_reason = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def mark_complete(self, data: dict):
        self.status = self.STATUS_COMPLETE
        self.completion_data = data
        self.completed_at = timezone.now()
        self.save(
            update_fields=["status", "completion_data", "completed_at", "updated_at"]
        )

    def mark_failed(self, reason: str):
        self.status = self.STATUS_FAILED
        self.failure_reason = reason
        self.completed_at = timezone.now()
        self.save(
            update_fields=["status", "failure_reason", "completed_at", "updated_at"]
        )

    def mark_cancelled(self):
        self.status = self.STATUS_CANCELLED
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at", "updated_at"])

    def __str__(self):
        return f"BankIDSession {self.order_ref} ({self.status})"
