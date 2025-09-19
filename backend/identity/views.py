from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BankIDSession
from .services import (
    bankid_cancel,
    bankid_collect,
    bankid_start,
    ensure_user_identity,
    link_or_create_user_from_oauth,
)
from .utils import issue_jwt_for_user

ALLOWED_OAUTH_PROVIDERS = {"google", "github"}


class OAuthExchangeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        provider = request.data.get("provider")
        code = request.data.get("code")
        if provider not in ALLOWED_OAUTH_PROVIDERS:
            return Response(
                {"detail": "Unsupported provider"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not code:
            return Response(
                {"detail": "Missing code"}, status=status.HTTP_400_BAD_REQUEST
            )
        user = link_or_create_user_from_oauth(provider, code)
        tokens = issue_jwt_for_user(user)
        return Response({"tokens": tokens, "user_id": user.id})


class BankIDStartView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        personal_number = request.data.get("personal_number")
        session = bankid_start(personal_number)
        return Response(
            {
                "order_ref": session.order_ref,
                "auto_start_token": session.auto_start_token,
            }
        )


class BankIDStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_ref, *args, **kwargs):
        session = get_object_or_404(BankIDSession, order_ref=order_ref)
        if session.status == BankIDSession.STATUS_PENDING:
            # Collect once (stub) -> complete
            bankid_collect(session)
            if session.status == BankIDSession.STATUS_COMPLETE:
                personal_number = session.completion_data["user"]["personalNumber"]
                # Link or create user based on hashed personal number
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user, _ = User.objects.get_or_create(
                    email=f"{personal_number}@bankid.local",
                    defaults={"username": personal_number},
                )
                ensure_user_identity(user, personal_number)
                tokens = issue_jwt_for_user(user)
                return Response(
                    {"status": session.status, "tokens": tokens, "user_id": user.id}
                )
        return Response({"status": session.status})


class BankIDCancelView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, order_ref, *args, **kwargs):
        session = get_object_or_404(BankIDSession, order_ref=order_ref)
        bankid_cancel(session)
        return Response({"status": session.status})
