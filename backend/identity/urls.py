from django.urls import path

from .views import (
    BankIDCancelView,
    BankIDStartView,
    BankIDStatusView,
    OAuthExchangeView,
)

app_name = "identity"

urlpatterns = [
    path("oauth/exchange/", OAuthExchangeView.as_view(), name="oauth-exchange"),
    path("bankid/start/", BankIDStartView.as_view(), name="bankid-start"),
    path(
        "bankid/status/<str:order_ref>/",
        BankIDStatusView.as_view(),
        name="bankid-status",
    ),
    path(
        "bankid/cancel/<str:order_ref>/",
        BankIDCancelView.as_view(),
        name="bankid-cancel",
    ),
]
