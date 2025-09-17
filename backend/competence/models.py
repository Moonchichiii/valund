"""
Competence passport models for document upload, review, and audit.
"""

import uuid
import os
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _


def competence_document_path(instance, filename):
    """Generate file path for competence documents"""
    return f'competence/{instance.user.id}/{uuid.uuid4()}{os.path.splitext(filename)[1]}'


class CompetenceDocument(models.Model):
    """Document uploaded for competence verification"""
    
    class DocumentType(models.TextChoices):
        CERTIFICATE = 'certificate', _('Certificate')
        DIPLOMA = 'diploma', _('Diploma')
        LICENSE = 'license', _('License')
        PORTFOLIO = 'portfolio', _('Portfolio')
        REFERENCE = 'reference', _('Reference Letter')
        OTHER = 'other', _('Other')
    
    class Status(models.TextChoices):
        UPLOADED = 'uploaded', _('Uploaded')
        UNDER_REVIEW = 'under_review', _('Under Review')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        REQUIRES_REVISION = 'requires_revision', _('Requires Revision')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='competence_documents'
    )
    
    # Document information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.CERTIFICATE
    )
    
    # File handling
    file = models.FileField(
        upload_to=competence_document_path,
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
        )]
    )
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    
    # Skills related to this document
    skills = models.ManyToManyField(
        'accounts.Skill',
        blank=True,
        related_name='competence_documents'
    )
    
    # Review and status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED
    )
    
    # Metadata
    issuing_organization = models.CharField(max_length=200, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'competence_document'
        verbose_name = _('Competence Document')
        verbose_name_plural = _('Competence Documents')
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.full_name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if document has expired"""
        if self.expiry_date:
            from django.utils import timezone
            return timezone.now().date() > self.expiry_date
        return False


class CompetenceReview(models.Model):
    """Review record for competence documents"""
    
    class ReviewResult(models.TextChoices):
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        REQUIRES_REVISION = 'requires_revision', _('Requires Revision')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        CompetenceDocument,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='competence_reviews'
    )
    
    # Review details
    result = models.CharField(
        max_length=20,
        choices=ReviewResult.choices
    )
    notes = models.TextField()
    private_notes = models.TextField(
        blank=True,
        help_text='Internal notes not visible to document owner'
    )
    
    # Review criteria scores (1-5 scale)
    authenticity_score = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True,
        blank=True
    )
    relevance_score = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True,
        blank=True
    )
    quality_score = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'competence_review'
        verbose_name = _('Competence Review')
        verbose_name_plural = _('Competence Reviews')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review of {self.document.title} by {self.reviewer.full_name}"


class CompetenceAuditLog(models.Model):
    """Audit trail for competence document changes"""
    
    class Action(models.TextChoices):
        UPLOADED = 'uploaded', _('Uploaded')
        REVIEWED = 'reviewed', _('Reviewed')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        REVISED = 'revised', _('Revised')
        DELETED = 'deleted', _('Deleted')
        STATUS_CHANGED = 'status_changed', _('Status Changed')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        CompetenceDocument,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='competence_audit_logs'
    )
    
    action = models.CharField(max_length=20, choices=Action.choices)
    description = models.TextField()
    
    # Store previous and new values for status changes
    previous_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    
    # IP address and user agent for security
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'competence_audit_log'
        verbose_name = _('Competence Audit Log')
        verbose_name_plural = _('Competence Audit Logs')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.document.title} by {self.user.full_name}"


class CompetenceTemplate(models.Model):
    """Templates for common competence document types"""
    
    name = models.CharField(max_length=100, unique=True)
    document_type = models.CharField(
        max_length=20,
        choices=CompetenceDocument.DocumentType.choices
    )
    description = models.TextField()
    
    # Required fields for this template
    required_fields = models.JSONField(default=list)
    
    # Suggested skills for this template
    suggested_skills = models.ManyToManyField(
        'accounts.Skill',
        blank=True,
        related_name='competence_templates'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'competence_template'
        verbose_name = _('Competence Template')
        verbose_name_plural = _('Competence Templates')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"
