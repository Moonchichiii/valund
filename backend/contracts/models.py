"""Contracts domain models for legally binding agreements."""

import hashlib
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class ContractTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    version = models.CharField(max_length=50, default="1.0")
    description = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    file = models.FileField(upload_to="contract_templates/", blank=True)
    checksum = models.CharField(max_length=64, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("name", "version")
        ordering = ["-created_at"]

    def __str__(self):  # pragma: no cover - trivial
        return f"Template {self.name} v{self.version}"

    def save(self, *args, **kwargs):
        base_text = self.body or ""
        self.checksum = _sha256(base_text.strip())
        super().save(*args, **kwargs)


class Contract(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        PENDING = "pending_signatures", _("Pending Signatures")
        SIGNED = "fully_signed", _("Fully Signed")
        VOID = "void", _("Void")
        EXPIRED = "expired", _("Expired")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_contracts",
    )
    talent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="talent_contracts",
    )
    template = models.ForeignKey(
        ContractTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contracts",
    )
    title = models.CharField(max_length=255)
    body_snapshot = models.TextField()
    body_checksum = models.CharField(max_length=64, editable=False)
    file = models.FileField(upload_to="contracts/files/", blank=True)
    original_filename = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    effective_date = models.DateField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["talent", "status"]),
            models.Index(fields=["body_checksum"]),
        ]

    def __str__(self):  # pragma: no cover - trivial
        return f"Contract {self.title} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        self.body_checksum = _sha256(self.body_snapshot.strip())
        super().save(*args, **kwargs)

    def send_for_signature(self):
        if self.status != self.Status.DRAFT:
            return
        self.status = self.Status.PENDING
        self.save(update_fields=["status"])

    def mark_fully_signed(self):
        if self.status == self.Status.SIGNED:
            return
        self.status = self.Status.SIGNED
        self.finalized_at = timezone.now()
        if not self.effective_date:
            self.effective_date = timezone.now().date()
        self.save(update_fields=["status", "finalized_at", "effective_date"])

    def void(self, reason: str = ""):
        if self.status in [self.Status.SIGNED, self.Status.VOID]:
            return
        self.status = self.Status.VOID
        self.save(update_fields=["status"])
        ContractEvent.objects.create(
            contract=self, event_type="voided", metadata={"reason": reason}
        )

    def check_fully_signed(self):
        required = {self.company_id, self.talent_id}
        signed = set(
            ContractSignature.objects.filter(contract=self).values_list(
                "signer_id", flat=True
            )
        )
        if required.issubset(signed):
            self.mark_fully_signed()


class ContractSignature(models.Model):
    class Role(models.TextChoices):
        COMPANY = "company", _("Company")
        TALENT = "talent", _("Talent")
        WITNESS = "witness", _("Witness")
        SYSTEM = "system", _("System")

    class SignatureType(models.TextChoices):
        TYPED = "typed", _("Typed")
        UPLOADED = "uploaded", _("Uploaded")
        DRAWN = "drawn", _("Drawn")
        SYSTEM = "system", _("System")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="signatures"
    )
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="signatures"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    signed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    signature_type = models.CharField(max_length=10, choices=SignatureType.choices)
    signature_image = models.FileField(upload_to="contracts/signatures/", blank=True)
    signature_hash = models.CharField(max_length=128, editable=False)
    is_valid = models.BooleanField(default=True)

    class Meta:
        unique_together = ("contract", "signer")
        ordering = ["signed_at"]

    def __str__(self):  # pragma: no cover - trivial
        return f"Signature {self.role} {self.signer_id} on {self.contract_id}"

    def save(self, *args, **kwargs):
        base = f"{self.contract.body_checksum}|{self.signer_id}|{self.role}|{timezone.now().isoformat()}"
        self.signature_hash = _sha256(base)
        super().save(*args, **kwargs)
        # After save, check full signature set
        self.contract.check_fully_signed()


class ContractEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=50)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):  # pragma: no cover - trivial
        return f"Event {self.event_type} for {self.contract_id}"
