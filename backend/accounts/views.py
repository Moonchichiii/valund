# accounts/views.py — pragmatic security-focused views (balanced for dev & prod)

import logging
from typing import Optional

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from rest_framework import permissions, status, throttling
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

# Optional: django-ratelimit (kept optional; comment in for prod)
try:
    from django_ratelimit.decorators import ratelimit  # type: ignore
    RATELIMIT_AVAILABLE = True
except Exception:
    RATELIMIT_AVAILABLE = False
    ratelimit = None  # type: ignore

from .serializers import (
    PasswordChangeSerializer,
    # If you already have these; else scaffold minimal versions:
    # - UserRegistrationSerializer
    # - PasswordChangeSerializer
    # If not present, comment out the endpoints that use them.
    # For completeness, we assume they exist.
    UserRegistrationSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()

# --- Soft feature flags (auto-disable if model missing) ---------------------

try:
    from .models import SecurityLog  # optional
    SECURITY_LOGS_ENABLED = True
except Exception:
    SecurityLog = None  # type: ignore
    SECURITY_LOGS_ENABLED = False

try:
    from .models import UserSession  # optional
    SESSIONS_TABLE_ENABLED = True
except Exception:
    UserSession = None  # type: ignore
    SESSIONS_TABLE_ENABLED = False


# --- Helpers ----------------------------------------------------------------

def _get_client_ip(request) -> str:
    # behind proxy, SecurityMiddleware + SECURE_PROXY_SSL_HEADER should be set
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")

def _get_user_agent(request) -> str:
    return request.META.get("HTTP_USER_AGENT", "")[:400]  # store trimmed


def _cookie_secure() -> bool:
    # mirrors your settings (True when DEBUG=False)
    return bool(getattr(settings, "SESSION_COOKIE_SECURE", not settings.DEBUG))


# --- DRF throttles (sane defaults) -----------------------------------------

class LoginThrottle(throttling.AnonRateThrottle):
    scope = "login"
    rate = "10/hour"  # adjust via REST_FRAMEWORK DEFAULT_THROTTLE_RATES if preferred


class AuthThrottle(throttling.UserRateThrottle):
    scope = "auth"
    rate = "30/min"   # overall authenticated auth-ish actions


# --- Views ------------------------------------------------------------------

# Decorator pack (csrf + cache) used for auth endpoints
_base_auth_decorators = [csrf_protect, never_cache]
if RATELIMIT_AVAILABLE:
    # PROD: tighten IP-based ratelimit; DRF throttle still applies
    _base_auth_decorators.append(ratelimit(key="ip", rate="20/h", method="POST", block=True))


@method_decorator(_base_auth_decorators, name="dispatch")
class LoginView(APIView):
    """Secure login: account lockouts, JWT cookie, optional audit/session rows."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request, *args, **kwargs):
        email = str(request.data.get("email", "")).lower().strip()
        password = str(request.data.get("password", ""))

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Try to fetch user to handle lockouts and status before authenticate
        user: Optional[User] = None
        try:
            user = User.objects.get(email=email)
            if getattr(user, "is_account_locked", False):
                if SECURITY_LOGS_ENABLED:
                    SecurityLog.objects.create(
                        user=user,
                        event_type="login_failed",
                        ip_address=_get_client_ip(request),
                        user_agent=_get_user_agent(request),
                        details={"reason": "account_locked"},
                    )
                return Response({"detail": "Account temporarily locked."}, status=status.HTTP_423_LOCKED)

            # enforce active status if you added AccountStatus
            if hasattr(user, "account_status") and user.account_status != getattr(User, "AccountStatus").ACTIVE:
                return Response({"detail": "Account is not active."}, status=status.HTTP_403_FORBIDDEN)

        except User.DoesNotExist:
            # do a fake auth to avoid timing-based user enumeration
            authenticate(request, username=email, password=password)
            if SECURITY_LOGS_ENABLED:
                SecurityLog.objects.create(
                    user=None,  # type: ignore[arg-type]
                    event_type="login_failed",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    details={"email": email, "reason": "user_not_found"},
                )
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        # Real authentication
        authed = authenticate(request, username=email, password=password)
        if authed is None:
            # record failed try + possible lockout
            try:
                user.record_failed_login()  # uses atomic F() update in our model
            except Exception:
                pass

            if SECURITY_LOGS_ENABLED:
                SecurityLog.objects.create(
                    user=user,
                    event_type="login_failed",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    details={"reason": "invalid_password"},
                )
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        # success path
        authed.record_successful_login()

        refresh = RefreshToken.for_user(authed)
        access_token = refresh.access_token

        # optional: create a sessions row
        if SESSIONS_TABLE_ENABLED:
            try:
                UserSession.objects.create(
                    user=authed,
                    session_key=request.session.session_key or "",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    device_fingerprint="",  # add if you implement one
                    location="",            # add if you implement geo-IP
                )
            except Exception:
                logger.exception("Could not create UserSession row.")

        if SECURITY_LOGS_ENABLED:
            SecurityLog.objects.create(
                user=authed,
                event_type="login_success",
                ip_address=_get_client_ip(request),
                user_agent=_get_user_agent(request),
                session_key=request.session.session_key or "",
            )

        # build response + HttpOnly cookie for refresh
        resp = Response(
            {
                "user": UserSerializer(authed).data,
                "tokens": {"access": str(access_token), "refresh": str(refresh)},
            },
            status=status.HTTP_200_OK,
        )
        # HttpOnly refresh cookie (rotate on login)
        resp.set_cookie(
            key="refresh_token",
            value=str(refresh),
            max_age=int(refresh.lifetime.total_seconds()),
            httponly=True,
            secure=_cookie_secure(),  # True in prod
            samesite="Lax",
            path="/",
        )
        logger.info("Successful login for %s from %s", authed.email, _get_client_ip(request))
        return resp


@method_decorator(_base_auth_decorators, name="dispatch")
class RegisterView(APIView):
    """Minimal secure registration (keeps it simple; logs & sessions optional)."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user: User = serializer.save()
        # mark as pending/needs verification if you want stricter prod flows
        if hasattr(user, "account_status") and getattr(User, "AccountStatus", None):
            if settings.DEBUG:
                # in dev, immediately active to make life easy
                user.account_status = User.AccountStatus.ACTIVE  # type: ignore[attr-defined]
            user.save(update_fields=["account_status"])

        # issue JWTs
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        # optional session + log
        if SESSIONS_TABLE_ENABLED:
            try:
                UserSession.objects.create(
                    user=user,
                    session_key=request.session.session_key or "",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                )
            except Exception:
                logger.exception("Could not create UserSession on registration")

        if SECURITY_LOGS_ENABLED:
            SecurityLog.objects.create(
                user=user,
                event_type="login_success",
                ip_address=_get_client_ip(request),
                user_agent=_get_user_agent(request),
                details={"action": "registration"},
                session_key=request.session.session_key or "",
            )

        resp = Response(
            {"user": UserSerializer(user).data, "tokens": {"access": str(access_token), "refresh": str(refresh)}},
            status=status.HTTP_201_CREATED,
        )
        resp.set_cookie(
            key="refresh_token",
            value=str(refresh),
            max_age=int(refresh.lifetime.total_seconds()),
            httponly=True,
            secure=_cookie_secure(),
            samesite="Lax",
            path="/",
        )
        logger.info("New user registered: %s from %s", user.email, _get_client_ip(request))
        return resp


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # optional last_activity update (throttled in model)
        try:
            if hasattr(request.user, "update_activity"):
                request.user.update_activity()
        except Exception:
            pass
        return Response(UserSerializer(request.user).data)

    def patch(self, request, *args, **kwargs):
        # If you have a dedicated serializer for profile updates, use that.
        # For now, keep it simple and reuse UserSerializer with partial=True if it supports it.
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            old_first, old_last, old_phone = request.user.first_name, request.user.last_name, getattr(request.user, "phone_number", "")
            user = serializer.save()
            if SECURITY_LOGS_ENABLED:
                SecurityLog.objects.create(
                    user=user,
                    event_type="profile_update",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    details={
                        "old": {"first_name": old_first, "last_name": old_last, "phone_number": old_phone},
                        "new": serializer.validated_data,
                    },
                )
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Try to blacklist the refresh token if cookie/body provides it
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # works only if blacklist app is installed
            except (TokenError, InvalidToken, Exception):
                # not fatal—continue to clear cookie
                logger.debug("Refresh token could not be blacklisted; continuing logout.")

        # deactivate current session row if present
        if SESSIONS_TABLE_ENABLED:
            try:
                UserSession.objects.filter(
                    user=request.user,
                    session_key=request.session.session_key or "",
                    is_active=True,
                ).update(is_active=False)
            except Exception:
                pass

        if SECURITY_LOGS_ENABLED:
            try:
                SecurityLog.objects.create(
                    user=request.user,
                    event_type="logout",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    session_key=request.session.session_key or "",
                )
            except Exception:
                pass

        resp = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        resp.delete_cookie("refresh_token", path="/", samesite="Lax")
        return resp


class ChangePasswordView(APIView):
    """Change password and invalidate other sessions."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AuthThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordChangeSerializer(data=request.data, context={"user": request.user})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data["new_password"])
        if hasattr(request.user, "password_changed_at"):
            request.user.password_changed_at = timezone.now()
        request.user.save(update_fields=["password"] + (["password_changed_at"] if hasattr(request.user, "password_changed_at") else []))

        # invalidate other sessions (keep current)
        if SESSIONS_TABLE_ENABLED:
            try:
                UserSession.objects.filter(user=request.user).exclude(
                    session_key=request.session.session_key or ""
                ).update(is_active=False)
            except Exception:
                pass

        if SECURITY_LOGS_ENABLED:
            try:
                SecurityLog.objects.create(
                    user=request.user,
                    event_type="password_change",
                    ip_address=_get_client_ip(request),
                    user_agent=_get_user_agent(request),
                    session_key=request.session.session_key or "",
                )
            except Exception:
                pass

        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class UserSessionsView(APIView):
    """List & terminate active sessions (optional feature)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not SESSIONS_TABLE_ENABLED:
            return Response([], status=status.HTTP_200_OK)

        qs = UserSession.objects.filter(user=request.user, is_active=True).order_by("-last_activity")
        current_key = request.session.session_key or ""
        data = [
            {
                "id": s.id,
                "ip_address": s.ip_address,
                "created_at": s.created_at,
                "last_activity": s.last_activity,
                "is_current": s.session_key == current_key,
                "device": s.user_agent[:120],
                "location": getattr(s, "location", ""),
            }
            for s in qs
        ]
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, session_id, *args, **kwargs):
        if not SESSIONS_TABLE_ENABLED:
            return Response({"detail": "Sessions feature disabled."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            session = UserSession.objects.get(id=session_id, user=request.user, is_active=True)
        except UserSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        if session.session_key == (request.session.session_key or ""):
            return Response({"detail": "Cannot terminate current session."}, status=status.HTTP_400_BAD_REQUEST)

        session.is_active = False
        session.save(update_fields=["is_active"])

        if SECURITY_LOGS_ENABLED:
            SecurityLog.objects.create(
                user=request.user,
                event_type="logout",
                ip_address=_get_client_ip(request),
                user_agent=_get_user_agent(request),
                details={"action": "remote_session_termination", "terminated_session_id": session_id},
            )
        return Response({"detail": "Session terminated."}, status=status.HTTP_200_OK)
