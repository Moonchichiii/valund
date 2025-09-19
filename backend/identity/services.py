import secrets
from typing import Tuple

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import BankIDSession, SocialAccountLink, UserIdentity

User = get_user_model()

# --- OAuth / Social linking stubs ---


def exchange_code_for_user(provider: str, code: str) -> Tuple[str, dict]:
    """Stub: exchange authorization code for (provider_user_id, profile_data)."""
    # In real implementation perform HTTP to provider token endpoint then userinfo.
    fake_user_id = f"{provider}_user_{code[:8]}"
    profile = {
        "email": f"{code[:6]}@example.com",
        "name": "Stub User",
        "provider": provider,
    }
    return fake_user_id, profile


def link_or_create_user_from_oauth(provider: str, code: str) -> User:
    provider_user_id, profile = exchange_code_for_user(provider, code)
    email = profile.get("email")
    with transaction.atomic():
        link = (
            SocialAccountLink.objects.filter(
                provider=provider, provider_user_id=provider_user_id
            )
            .select_related("user")
            .first()
        )
        if link:
            return link.user
        user, _created = User.objects.get_or_create(
            email=email, defaults={"username": email.split("@")[0]}
        )
        SocialAccountLink.objects.create(
            user=user,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            extra_data=profile,
        )
        return user


# --- BankID stubs ---


def bankid_start(personal_number: str | None = None) -> BankIDSession:
    order_ref = secrets.token_hex(16)
    auto_start_token = secrets.token_hex(8)
    personal_hash = (
        UserIdentity.hash_personal_number(personal_number) if personal_number else None
    )
    return BankIDSession.objects.create(
        order_ref=order_ref,
        auto_start_token=auto_start_token,
        personal_number_hash=personal_hash,
    )


def bankid_collect(session: BankIDSession) -> BankIDSession:
    # For stub: after one collect we mark complete.
    if session.status == BankIDSession.STATUS_PENDING:
        completion_data = {
            "completionCode": "userSign",
            "user": {"personalNumber": "199001011234", "name": "Stub BankID User"},
        }
        session.mark_complete(completion_data)
    return session


def bankid_cancel(session: BankIDSession) -> BankIDSession:
    if session.status == BankIDSession.STATUS_PENDING:
        session.mark_cancelled()
    return session


def ensure_user_identity(user: User, personal_number: str) -> UserIdentity:
    hashed = UserIdentity.hash_personal_number(personal_number)
    ident, _ = UserIdentity.objects.get_or_create(
        user=user, scheme=UserIdentity.SCHEME_PERSONAL_NUMBER, identity_hash=hashed
    )
    return ident
