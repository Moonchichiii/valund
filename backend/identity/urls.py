from django.urls import path

from .views import (
    BankIDCancelView,
    BankIDStartView,
    BankIDStatusView,
    OAuthExchangeView,
)

urlpatterns = [
    # OAuth / Social authentication
    path("oauth/exchange/", OAuthExchangeView.as_view(), name="oauth-exchange"),

    # BankID authentication
    path("bankid/start/", BankIDStartView.as_view(), name="bankid-start"),
    path("bankid/status/<str:order_ref>/", BankIDStatusView.as_view(), name="bankid-status"),
    path("bankid/cancel/<str:order_ref>/", BankIDCancelView.as_view(), name="bankid-cancel"),
]

# Optional: geographic access check if you add the view later
try:
    from .views import GeographicCheckView  # type: ignore
    urlpatterns.insert(0, path("geo-check/", GeographicCheckView.as_view(), name="geo-check"))
except Exception:
    pass

app_name = "identity"
