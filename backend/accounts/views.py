
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import permissions, status, throttling
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
	PasswordChangeSerializer,
	UserRegistrationSerializer,
	UserSerializer,
)

User = get_user_model()


def _get_client_ip(request) -> str:
	xff = request.META.get("HTTP_X_FORWARDED_FOR")
	if xff:
		return xff.split(",")[0].strip()
	return request.META.get("REMOTE_ADDR", "127.0.0.1")


def _safe_token_fragment(token: str) -> str:
	if not token:
		return "none"
	return f"{token[:12]}...len={len(token)}"


def _debug_csrf_and_tokens(request, view_name: str):
	# Logging removed; keeping function as no-op to avoid breaking calls.
	return


def _ensure_session(request):
	if not getattr(request, "session", None) or not request.session.session_key:
		request.session["__touch"] = True
		request.session.save()


def _log_security_event(user, event_type: str, request, details: dict = None):
	try:
		from .models import SecurityLog
		SecurityLog.objects.create(
			user=user,
			event_type=event_type,
			ip_address=_get_client_ip(request),
			user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
			session_key=getattr(request.session, 'session_key', '') or "",
			details=details or {}
		)
	except ImportError:
		pass
	except Exception:
		pass


def _create_user_session(user, request):
	try:
		from .models import UserSession
		UserSession.objects.create(
			user=user,
			session_key=getattr(request.session, 'session_key', '') or "",
			ip_address=_get_client_ip(request),
			user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
		)
	except ImportError:
		pass
	except Exception:
		pass


def _deactivate_user_sessions(user, request, exclude_current=True):
	try:
		from .models import UserSession
		sessions = UserSession.objects.filter(user=user, is_active=True)
		if exclude_current:
			current_key = getattr(request.session, 'session_key', '') or ""
			sessions = sessions.exclude(session_key=current_key)
		sessions.update(is_active=False)
	except ImportError:
		pass
	except Exception:
		pass


class LoginThrottle(throttling.AnonRateThrottle):
	scope = "login"
	rate = "10/hour"


class AuthThrottle(throttling.UserRateThrottle):
	scope = "auth"
	rate = "30/min"


@method_decorator(never_cache, name="dispatch")
@method_decorator(csrf_protect, name="post")
class LoginView(APIView):
	permission_classes = [permissions.AllowAny]
	throttle_classes = [LoginThrottle]

	def post(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "LoginView.post")
		email = str(request.data.get("email", "")).lower().strip()
		password = str(request.data.get("password", ""))

		if not email or not password:
			return Response(
				{"detail": "Email and password are required."},
				status=status.HTTP_400_BAD_REQUEST
			)

		try:
			user = User.objects.get(email=email)
			if hasattr(user, "is_account_locked") and user.is_account_locked:
				_log_security_event(user, "login_failed", request, {"reason": "account_locked"})
				return Response(
					{"detail": "Account temporarily locked."},
					status=status.HTTP_423_LOCKED
				)
			if hasattr(user, "account_status") and hasattr(User, "AccountStatus"):
				if user.account_status != User.AccountStatus.ACTIVE:
					return Response(
						{"detail": "Account is not active."},
						status=status.HTTP_403_FORBIDDEN
					)
		except User.DoesNotExist:
			authenticate(request, username=email, password=password)
			_log_security_event(None, "login_failed", request, {
				"email": email,
				"reason": "user_not_found"
			})
			return Response(
				{"detail": "Invalid email or password."},
				status=status.HTTP_401_UNAUTHORIZED
			)

		authenticated_user = authenticate(request, username=email, password=password)
		if authenticated_user is None:
			if hasattr(user, 'record_failed_login'):
				try:
					user.record_failed_login()
				except Exception:
					pass
			_log_security_event(user, "login_failed", request, {"reason": "invalid_password"})
			return Response(
				{"detail": "Invalid email or password."},
				status=status.HTTP_401_UNAUTHORIZED
			)

		if hasattr(authenticated_user, 'record_successful_login'):
			try:
				authenticated_user.record_successful_login()
			except Exception:
				pass

		refresh = RefreshToken.for_user(authenticated_user)
		access_token = refresh.access_token

		_ensure_session(request)
		_create_user_session(authenticated_user, request)
		_log_security_event(authenticated_user, "login_success", request)

		response_data = {
			"user": UserSerializer(authenticated_user).data,
			"tokens": {
				"access": str(access_token),
				"refresh": str(refresh)
			}
		}

		resp = Response(response_data, status=status.HTTP_200_OK)
		resp.set_cookie(
			key="refresh_token",
			value=str(refresh),
			max_age=int(refresh.lifetime.total_seconds()),
			httponly=True,
			secure=not settings.DEBUG,
			samesite="Lax",
			path="/",
		)
		return resp


@method_decorator(never_cache, name="dispatch")
@method_decorator(csrf_protect, name="post")
class RegisterView(APIView):
	permission_classes = [permissions.AllowAny]
	throttle_classes = [AuthThrottle]

	def post(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "RegisterView.post")
		serializer = UserRegistrationSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		user = serializer.save()

		if hasattr(user, "account_status") and hasattr(User, "AccountStatus") and settings.DEBUG:
			user.account_status = User.AccountStatus.ACTIVE
			user.save(update_fields=["account_status"])

		refresh = RefreshToken.for_user(user)
		access_token = refresh.access_token

		_ensure_session(request)
		_create_user_session(user, request)
		_log_security_event(user, "login_success", request, {"action": "registration"})

		response_data = {
			"user": UserSerializer(user).data,
			"tokens": {
				"access": str(access_token),
				"refresh": str(refresh)
			}
		}

		resp = Response(response_data, status=status.HTTP_201_CREATED)
		resp.set_cookie(
			key="refresh_token",
			value=str(refresh),
			max_age=int(refresh.lifetime.total_seconds()),
			httponly=True,
			secure=not settings.DEBUG,
			samesite="Lax",
			path="/",
		)
		return resp


class MeView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "MeView.get")
		if hasattr(request.user, "update_activity"):
			try:
				request.user.update_activity()
			except Exception:
				pass
		return Response(UserSerializer(request.user).data)

	@method_decorator(csrf_protect)
	def patch(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "MeView.patch")
		serializer = UserSerializer(request.user, data=request.data, partial=True)
		if serializer.is_valid():
			old_data = {
				"first_name": request.user.first_name,
				"last_name": request.user.last_name,
				"phone_number": getattr(request.user, "phone_number", "")
			}
			user = serializer.save()
			_log_security_event(user, "profile_update", request, {
				"old": old_data,
				"new": serializer.validated_data,
			})
			return Response(UserSerializer(user).data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name="post")
class LogoutView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "LogoutView.post")

		_ensure_session(request)

		refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")
		if refresh_token:
			try:
				token = RefreshToken(refresh_token)
				token.blacklist()
			except (TokenError, InvalidToken, Exception):
				pass

		try:
			from .models import UserSession
			UserSession.objects.filter(
				user=request.user,
				session_key=getattr(request.session, 'session_key', '') or "",
				is_active=True,
			).update(is_active=False)
		except ImportError:
			pass
		except Exception:
			pass

		_log_security_event(request.user, "logout", request)

		resp = Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
		resp.delete_cookie("refresh_token", path="/", samesite="Lax")
		return resp


@method_decorator(csrf_protect, name="post")
class ChangePasswordView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	throttle_classes = [AuthThrottle]

	def post(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "ChangePasswordView.post")
		serializer = PasswordChangeSerializer(data=request.data, context={"user": request.user})
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		request.user.set_password(serializer.validated_data["new_password"])
		if hasattr(request.user, "password_changed_at"):
			request.user.password_changed_at = timezone.now()

		update_fields = ["password"]
		if hasattr(request.user, "password_changed_at"):
			update_fields.append("password_changed_at")
		request.user.save(update_fields=update_fields)

		_deactivate_user_sessions(request.user, request, exclude_current=True)
		_log_security_event(request.user, "password_change", request)

		return Response({"detail": "Password changed successfully"}, status=status.HTTP_200_OK)


class UserSessionsView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		_debug_csrf_and_tokens(request, "UserSessionsView.get")
		try:
			from .models import UserSession
			sessions = UserSession.objects.filter(
				user=request.user,
				is_active=True
			).order_by("-last_activity")

			current_key = getattr(request.session, 'session_key', '') or ""

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
				for s in sessions
			]

			return Response(data, status=status.HTTP_200_OK)

		except ImportError:
			return Response([], status=status.HTTP_200_OK)

	@method_decorator(csrf_protect)
	def delete(self, request, session_id, *args, **kwargs):
		_debug_csrf_and_tokens(request, "UserSessionsView.delete")
		try:
			from .models import UserSession
			session = UserSession.objects.get(
				id=session_id,
				user=request.user,
				is_active=True
			)

			current_key = getattr(request.session, 'session_key', '') or ""
			if session.session_key == current_key:
				return Response(
					{"detail": "Cannot terminate current session"},
					status=status.HTTP_400_BAD_REQUEST
				)

			session.is_active = False
			session.save(update_fields=["is_active"])

			_log_security_event(request.user, "logout", request, {
				"action": "remote_session_termination",
				"terminated_session_id": session_id
			})

			return Response({"detail": "Session terminated"}, status=status.HTTP_200_OK)

		except ImportError:
			return Response(
				{"detail": "Sessions not available"},
				status=status.HTTP_400_BAD_REQUEST
			)
		except UserSession.DoesNotExist:
			return Response(
				{"detail": "Session not found"},
				status=status.HTTP_404_NOT_FOUND
			)


class CsrfView(APIView):
	permission_classes = [permissions.AllowAny]

	@method_decorator(ensure_csrf_cookie)
	def get(self, request, *args, **kwargs):
		return Response({"detail": "CSRF cookie set"}, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name="post")
class RefreshFromCookieView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request, *args, **kwargs):
		refresh_token = request.COOKIES.get("refresh_token")
		if not refresh_token:
			return Response({"detail": "No refresh cookie"}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			token = RefreshToken(refresh_token)
			access = str(token.access_token)
			return Response({"access": access}, status=status.HTTP_200_OK)
		except Exception:
			return Response({"detail": "Invalid refresh"}, status=status.HTTP_401_UNAUTHORIZED)
