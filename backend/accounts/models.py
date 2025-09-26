"""
User and profile models for the accounts app.
"""

import hashlib
import uuid

from django.contrib.auth.models import AbstractUser
from django.core.cache import cache
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom user model with enhanced security & compliance"""

    # --- Core domain classification ---
    class UserType(models.TextChoices):
        FREELANCER = "freelancer", _("Freelancer")
        CLIENT = "client", _("Client")
        ADMIN = "admin", _("Admin")

    class AccountStatus(models.TextChoices):
        ACTIVE = "active", _("Active")
        SUSPENDED = "suspended", _("Suspended")
        DEACTIVATED = "deactivated", _("Deactivated")
        PENDING_VERIFICATION = "pending", _("Pending Verification")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), unique=True)
    user_type = models.CharField(
        max_length=20, choices=UserType.choices, default=UserType.FREELANCER
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message='Phone number must be entered in the format: "+999999999". Up to 15 digits allowed.',
            )
        ],
    )

    # --- Security state ---
    is_verified = models.BooleanField(default=False)
    account_status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.PENDING_VERIFICATION
    )
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(auto_now_add=True)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes_generated = models.DateTimeField(null=True, blank=True)

    # --- Privacy & compliance ---
    marketing_consent = models.BooleanField(default=False)
    analytics_consent = models.BooleanField(default=False)
    data_processing_consent = models.BooleanField(default=True)
    privacy_policy_accepted_at = models.DateTimeField(null=True, blank=True)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    # --- Audit ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["user_type"]),
            models.Index(fields=["account_status"]),
            models.Index(fields=["is_verified"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"

    @property
    def full_name(self) -> str:
        """Return the user's full name"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_account_locked(self) -> bool:
        """Check if the account is currently locked"""
        return bool(self.account_locked_until and timezone.now() < self.account_locked_until)

    # --- Account lock helpers (use F() to reduce race risk) ---
    def lock_account(self, duration_minutes: int = 30):
        """Lock account for specified duration"""
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        # Keep attempts as-is so you can see how many happened before the lock.
        self.save(update_fields=["account_locked_until"])

    def unlock_account(self):
        """Unlock account and reset failed attempts"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.save(update_fields=["account_locked_until", "failed_login_attempts", "last_failed_login"])

    def record_failed_login(self, lock_threshold: int = 5, lock_minutes: int = 30):
        """Record a failed login attempt, locking when threshold is reached"""
        # Increment atomically where possible
        User.objects.filter(pk=self.pk).update(
            failed_login_attempts=F("failed_login_attempts") + 1, last_failed_login=timezone.now()
        )
        self.refresh_from_db(fields=["failed_login_attempts", "last_failed_login", "account_locked_until"])

        if self.failed_login_attempts >= lock_threshold and not self.is_account_locked:
            self.lock_account(duration_minutes=lock_minutes)

    def record_successful_login(self):
        """Record a successful login"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.account_locked_until = None
        self.last_activity = timezone.now()
        self.save(
            update_fields=[
                "failed_login_attempts",
                "last_failed_login",
                "account_locked_until",
                "last_activity",
            ]
        )

    def update_activity(self, throttle_seconds: int = 300):
        """Update last activity timestamp (with caching throttle)"""
        cache_key = f"user_activity_{self.id}"
        if not cache.get(cache_key):
            self.last_activity = timezone.now()
            self.save(update_fields=["last_activity"])
            cache.set(cache_key, True, throttle_seconds)

    def generate_audit_hash(self) -> str:
        """Generate a deterministic hash for audit trail correlation"""
        content = f"{self.email}{self.created_at}{self.id}"
        return hashlib.sha256(content.encode()).hexdigest()


class SecurityLog(models.Model):
    """Track security-related events for auditing & anomaly detection"""

    class EventType(models.TextChoices):
        LOGIN_SUCCESS = "login_success", _("Login Success")
        LOGIN_FAILED = "login_failed", _("Login Failed")
        LOGOUT = "logout", _("Logout")
        PASSWORD_CHANGE = "password_change", _("Password Change")
        EMAIL_CHANGE = "email_change", _("Email Change")
        ACCOUNT_LOCKED = "account_locked", _("Account Locked")
        ACCOUNT_UNLOCKED = "account_unlocked", _("Account Unlocked")
        SUSPICIOUS_ACTIVITY = "suspicious_activity", _("Suspicious Activity")
        BANKID_AUTH = "bankid_auth", _("BankID Authentication")
        TWO_FACTOR_ENABLED = "two_factor_enabled", _("Two Factor Enabled")
        TWO_FACTOR_DISABLED = "two_factor_disabled", _("Two Factor Disabled")
        PROFILE_UPDATE = "profile_update", _("Profile Update")
        PERMISSION_CHANGE = "permission_change", _("Permission Change")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="security_logs")
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    session_key = models.CharField(max_length=40, blank=True)

    class Meta:
        db_table = "accounts_security_log"
        verbose_name = _("Security Log")
        verbose_name_plural = _("Security Logs")
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["event_type", "timestamp"]),
            models.Index(fields=["ip_address"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_event_type_display()} - {self.timestamp}"


class UserSession(models.Model):
    """Track active user sessions"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    location = models.CharField(max_length=100, blank=True)  # City, Country
    device_fingerprint = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "accounts_user_session"
        verbose_name = _("User Session")
        verbose_name_plural = _("User Sessions")
        ordering = ["-last_activity"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["session_key"]),
            models.Index(fields=["last_activity"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.ip_address} - {self.created_at}"

    @property
    def is_current_session(self) -> bool:
        """Heuristic: active if touched within last 30 minutes"""
        return timezone.now() - self.last_activity < timezone.timedelta(minutes=30)

    def deactivate(self):
        """Deactivate this session"""
        self.is_active = False
        self.save(update_fields=["is_active"])


# ---------------- Existing domain models (unchanged) ----------------

class Profile(models.Model):
    """Extended profile information for users"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(max_length=1000, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # Professional information
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    years_experience = models.PositiveIntegerField(null=True, blank=True)

    # Availability
    is_available = models.BooleanField(default=True)
    timezone = models.CharField(max_length=50, default="UTC")

    # Stripe Connect information (for freelancers receiving payments)
    stripe_account_id = models.CharField(max_length=255, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_profile"
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")

    def __str__(self):
        return f"{self.user.full_name}'s Profile"


class Skill(models.Model):
    """Skills that users can have"""

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts_skill"
        verbose_name = _("Skill")
        verbose_name_plural = _("Skills")
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    """Through model for user skills with proficiency level"""

    class ProficiencyLevel(models.IntegerChoices):
        BEGINNER = 1, _("Beginner")
        INTERMEDIATE = 2, _("Intermediate")
        ADVANCED = 3, _("Advanced")
        EXPERT = 4, _("Expert")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="user_skills")
    proficiency_level = models.IntegerField(
        choices=ProficiencyLevel.choices, default=ProficiencyLevel.INTERMEDIATE
    )
    years_experience = models.PositiveIntegerField(default=0)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts_user_skill"
        unique_together = ["user", "skill"]
        verbose_name = _("User Skill")
        verbose_name_plural = _("User Skills")

    def __str__(self):
        return f"{self.user.full_name} - {self.skill.name} ({self.get_proficiency_level_display()})"
# ---------------- Convenience: auto-create profile ----------------
@receiver(post_save, sender=User)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance: User, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
