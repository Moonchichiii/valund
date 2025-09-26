"""
URL configuration for accounts app.

Note:
- Main project already mounts this app at "api/auth/", so paths here are relative to that.
- Includes a CSRF seeding endpoint: GET /api/auth/csrf/
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import (
    ChangePasswordView,
    CsrfView,
    LoginView,
    LogoutView,
    MeView,
    RefreshFromCookieView,  # added
    RegisterView,
    UserSessionsView,
)

app_name = "accounts"

router = DefaultRouter()
ADVANCED_URLS: list = []

try:
    from .views import SecurityLogViewSet  # type: ignore
    router.register(r"security-logs", SecurityLogViewSet, basename="security-logs")
except Exception:
    pass

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

urlpatterns = [
    path("csrf/", CsrfView.as_view(), name="csrf"),
    path("refresh/", RefreshFromCookieView.as_view(), name="refresh"),
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("sessions/", UserSessionsView.as_view(), name="sessions"),
    path("sessions/<int:session_id>/", UserSessionsView.as_view(), name="session-delete"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
]

urlpatterns += ADVANCED_URLS
urlpatterns += [path("", include(router.urls))]
