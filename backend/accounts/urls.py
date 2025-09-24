"""
URL configuration for accounts app.
- Keeps current /auth/* endpoints you added.
- Keeps legacy SimpleJWT endpoints for compatibility.
- Optionally registers advanced views if they exist (email verify, reset, logs).
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# Your “balanced” views (already in your codebase)
from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    UserSessionsView,
)

# Optional/advanced views — import guarded so URLs appear only if you implement them
ADVANCED_URLS = []
router = DefaultRouter()

# Optional: SecurityLogViewSet
try:
    from .views import SecurityLogViewSet  # type: ignore
    router.register(r"security-logs", SecurityLogViewSet, basename="security-logs")
except Exception:
    pass

# Optional: Email verification
try:
    from .views import (  # type: ignore
        EmailVerificationConfirmView,
        EmailVerificationRequestView,
    )
    ADVANCED_URLS += [
        path("verify-email/request/", EmailVerificationRequestView.as_view(), name="email_verification_request"),
        path("verify-email/confirm/", EmailVerificationConfirmView.as_view(), name="email_verification_confirm"),
    ]
except Exception:
    pass

# Optional: Password reset
try:
    from .views import (  # type: ignore
        PasswordResetConfirmView,
        PasswordResetRequestView,
    )
    ADVANCED_URLS += [
        path("password-reset/request/", PasswordResetRequestView.as_view(), name="password_reset_request"),
        path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    ]
except Exception:
    pass

app_name = "accounts"

urlpatterns = [
    # ---------- Recommended scoped endpoints ----------
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/sessions/", UserSessionsView.as_view(), name="auth-sessions"),
    path("auth/sessions/<int:session_id>/", UserSessionsView.as_view(), name="auth-session-delete"),

    # ---------- Legacy SimpleJWT (keep for compatibility / tooling) ----------
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("verify/", TokenVerifyView.as_view(), name="token_verify"),
]

# Plug in advanced URLs if those views exist
urlpatterns += ADVANCED_URLS

# Router (security logs) if viewset exists
urlpatterns += [path("", include(router.urls))]
