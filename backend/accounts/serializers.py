# accounts/serializers.py — pragmatic & secure

from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


# ---- Helpers (no external deps; safe now, upgrade later) --------------------

def _sanitize(s: str) -> str:
    # very light sanitization; real HTML escaping happens in the renderer
    return " ".join(s.strip().split())

def _validate_username_basic(username: str) -> str:
    u = username.strip()
    if not u:
        raise serializers.ValidationError("Username is required.")
    # keep it simple; feel free to strengthen later
    import re
    if not re.match(r"^[a-zA-Z0-9_.-]+$", u):
        raise serializers.ValidationError(
            "Username can only contain letters, numbers, dots, underscores, and hyphens."
        )
    # disallow some systemy names
    blocked = {"admin", "root", "test", "user", "null", "undefined", "api", "www", "mail", "ftp", "support", "help"}
    if u.lower() in blocked:
        raise serializers.ValidationError("This username is not available.")
    return u


# ---- User-facing serializers ------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Secure user serializer with limited exposure."""

    full_name = serializers.ReadOnlyField()
    # these exist only if you used the enhanced model; guarded with source lookups
    account_status_display = serializers.CharField(source="get_account_status_display", read_only=True, required=False)
    user_type_display = serializers.CharField(source="get_user_type_display", read_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "user_type",             # optional if present on model
            "user_type_display",     # optional if present on model
            "phone_number",          # optional if present on model
            "is_verified",           # optional if present on model
            "account_status",        # optional if present on model
            "account_status_display",
            "two_factor_enabled",    # optional if present on model
            "marketing_consent",
            "analytics_consent",
            "created_at",
            "last_activity",
        ]
        read_only_fields = [
            "id",
            "is_verified",
            "account_status",
            "two_factor_enabled",
            "created_at",
            "last_activity",
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Registration with sensible validation; no heavy external checks required."""

    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this email already exists.")]
    )
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this username already exists.")],
    )
    password = serializers.CharField(write_only=True, min_length=12, max_length=128)
    password_confirm = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField(write_only=True)
    privacy_policy_accepted = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "user_type",  # if not on model, DRF will ignore at runtime
            "phone_number",
            "password",
            "password_confirm",
            "terms_accepted",
            "privacy_policy_accepted",
            "marketing_consent",
            "analytics_consent",
        ]

    # field-level validators
    def validate_email(self, value: str) -> str:
        email = _sanitize(value).lower()
        if "@" not in email:
            raise serializers.ValidationError("Please enter a valid email address.")
        # OPTIONAL: block known throwaway domains if you want (keep dev-friendly)
        # if any(d in email for d in ("mailinator", "yopmail", "tempmail")):
        #     raise serializers.ValidationError("Please use a permanent email address.")
        return email

    def validate_username(self, value: str) -> str:
        return _sanitize(_validate_username_basic(value))

    def validate_first_name(self, value: str) -> str:
        name = _sanitize(value)
        if len(name) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        if len(name) > 50:
            raise serializers.ValidationError("First name cannot exceed 50 characters.")
        return name

    def validate_last_name(self, value: str) -> str:
        name = _sanitize(value)
        if len(name) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        if len(name) > 50:
            raise serializers.ValidationError("Last name cannot exceed 50 characters.")
        return name

    def validate_phone_number(self, value: str) -> str:
        if not value:
            return value
        phone = _sanitize(value)
        import re
        if not re.match(r"^\+?[\d\s\-\(\)]{10,20}$", phone):
            raise serializers.ValidationError("Please enter a valid phone number.")
        return phone

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)  # uses your AUTH_PASSWORD_VALIDATORS (min_length=12 etc.)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        # OPTIONAL: plug in breach checks later
        # if check_password_breach(value):
        #     raise serializers.ValidationError("This password appears in public breach lists.")
        return value

    def validate_terms_accepted(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("You must accept the terms of service to register.")
        return value

    def validate_privacy_policy_accepted(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("You must accept the privacy policy to register.")
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        # drop write-only helpers so they don't hit create(**validated_data)
        attrs.pop("password_confirm", None)
        attrs.pop("terms_accepted", None)
        attrs.pop("privacy_policy_accepted", None)
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        from django.utils import timezone

        password = validated_data.pop("password")
        # ensure username is a slug-like (optional, keeps URLs tidy)
        if "username" in validated_data:
            validated_data["username"] = slugify(validated_data["username"]) or validated_data["username"]

        # default account_status to ACTIVE in dev, else leave your business logic to views
        extras = {}
        if hasattr(User, "AccountStatus"):
            extras["account_status"] = getattr(User.AccountStatus, "ACTIVE", None)

        # consent timestamps if present on model
        if hasattr(User, "privacy_policy_accepted_at"):
            extras["privacy_policy_accepted_at"] = timezone.now()
        if hasattr(User, "terms_accepted_at"):
            extras["terms_accepted_at"] = timezone.now()

        user = User.objects.create_user(password=password, **validated_data, **extras)
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Update subset of user fields safely."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number", "marketing_consent", "analytics_consent"]

    def validate_first_name(self, value: str) -> str:
        if not value:
            return value
        name = _sanitize(value)
        if len(name) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        if len(name) > 50:
            raise serializers.ValidationError("First name cannot exceed 50 characters.")
        return name

    def validate_last_name(self, value: str) -> str:
        if not value:
            return value
        name = _sanitize(value)
        if len(name) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        if len(name) > 50:
            raise serializers.ValidationError("Last name cannot exceed 50 characters.")
        return name

    def validate_phone_number(self, value: str) -> str:
        if not value:
            return value
        phone = _sanitize(value)
        import re
        if not re.match(r"^\+?[\d\s\-\(\)]{10,20}$", phone):
            raise serializers.ValidationError("Please enter a valid phone number.")
        return phone


class PasswordChangeSerializer(serializers.Serializer):
    """Change password, enforcing validators and difference from current."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=12, max_length=128)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value: str) -> str:
        user = self.context["user"]
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value: str) -> str:
        user = self.context["user"]
        if user.check_password(value):
            raise serializers.ValidationError("New password must be different from the current one.")
        try:
            validate_password(value, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        # OPTIONAL: plug in breach/strength checks later
        # if not validate_password_strength(value)["is_valid"]:
        #     raise serializers.ValidationError(validate_password_strength(value)["issues"])
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs.get("new_password") != attrs.get("new_password_confirm"):
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})
        return attrs


# ---- Optional: if you plan to expose logs/sessions via API later -----------

# These serializers only activate if models exist; else you can remove them.

try:
    from .models import SecurityLog
    class SecurityLogSerializer(serializers.ModelSerializer):
        event_type_display = serializers.CharField(source="get_event_type_display", read_only=True)
        user_email = serializers.CharField(source="user.email", read_only=True)

        class Meta:
            model = SecurityLog
            fields = ["id", "user_email", "event_type", "event_type_display", "ip_address", "timestamp", "details"]
            read_only_fields = ["id", "timestamp"]

        def to_representation(self, instance):
            data = super().to_representation(instance)
            details = dict(data.get("details") or {})
            for k in ("password", "token", "session_key", "device_fingerprint"):
                details.pop(k, None)
            data["details"] = details
            return data
except Exception:
    pass


try:
    from .models import UserSession
    class UserSessionSerializer(serializers.ModelSerializer):
        is_current_session = serializers.ReadOnlyField()
        device_info = serializers.SerializerMethodField()

        class Meta:
            model = UserSession
            fields = ["id", "ip_address", "location", "created_at", "last_activity", "is_current_session", "device_info"]
            read_only_fields = ["id", "created_at", "last_activity"]

        def get_device_info(self, obj):
            # keep it simple without UA parsing libs
            ua = (obj.user_agent or "")[:120]
            return {"ua": ua}
except Exception:
    pass


class EmailChangeSerializer(serializers.Serializer):
    """Change email with password confirmation."""

    new_email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_new_email(self, value: str) -> str:
        email = _sanitize(value).lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        user = self.context["user"]
        if user.email.lower() == email:
            raise serializers.ValidationError("New email must be different from current email.")
        return email

    def validate_password(self, value: str) -> str:
        user = self.context["user"]
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
