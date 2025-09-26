import logging

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

from .serializers import (
	PasswordChangeSerializer,
	UserRegistrationSerializer,
	UserSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# Feature flags
try:
	from .models import SecurityLog
	SECURITY_LOGS_ENABLED = True
except Exception:
	SecurityLog = None
	SECURITY_LOGS_ENABLED = False

try:
	from .models import UserSession
	SESSIONS_TABLE_ENABLED = True
except Exception:
	UserSession = None
	SESSIONS_TABLE_ENABLED = False

# Helpers
def _get_client_ip(request) -> str:
	xff = request.META.get("HTTP_X_FORWARDED_FOR")
	if xff:
		return xff.split(",")[0].strip()
	return request.META.get("REMOTE_ADDR", "127.0.0.1")

def _get_user_agent(request) -> str:
	return request.META.get("HTTP_USER_AGENT", "")[:400]

def _cookie_secure() -> bool:
	return not settings.DEBUG

# Throttles
class LoginThrottle(throttling.AnonRateThrottle):
	scope = "login"
	rate = "10/hour"

class AuthThrottle(throttling.UserRateThrottle):
	scope = "auth"
	rate = "30/min"

@method_decorator([csrf_protect, never_cache], name="dispatch")
class LoginView(APIView):
	"""Login endpoint that returns user data + tokens in single response"""
	permission_classes = [permissions.AllowAny]
	throttle_classes = [LoginThrottle]

	def post(self, request, *args, **kwargs):
		email = str(request.data.get("email", "")).lower().strip()
		password = str(request.data.get("password", ""))

		if not email or not password:
			return Response(
				{"detail": "Email and password are required."},
				status=status.HTTP_400_BAD_REQUEST
			)

		try:
			user = User.objects.get(email=email)

			if getattr(user, "is_account_locked", False):
				if SECURITY_LOGS_ENABLED and SecurityLog:
					SecurityLog.objects.create(
						user=user,
						event_type="login_failed",
						ip_address=_get_client_ip(request),
						user_agent=_get_user_agent(request),
						details={"reason": "account_locked"},
					)
				return Response(
					{"detail": "Account temporarily locked."},
					status=status.HTTP_423_LOCKED
				)

			if hasattr(user, "account_status") and user.account_status != User.AccountStatus.ACTIVE:
				return Response(
					{"detail": "Account is not active."},
					status=status.HTTP_403_FORBIDDEN
				)

		except User.DoesNotExist:
			authenticate(request, username=email, password=password)
			if SECURITY_LOGS_ENABLED and SecurityLog:
				SecurityLog.objects.create(
					user=None,
					event_type="login_failed",
					ip_address=_get_client_ip(request),
					user_agent=_get_user_agent(request),
					details={"email": email, "reason": "user_not_found"},
				)
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

			if SECURITY_LOGS_ENABLED and SecurityLog:
				SecurityLog.objects.create(
					user=user,
					event_type="login_failed",
					ip_address=_get_client_ip(request),
					user_agent=_get_user_agent(request),
					details={"reason": "invalid_password"},
				)
			return Response(
				{"detail": "Invalid email or password."},
				status=status.HTTP_401_UNAUTHORIZED
			)

		if hasattr(authenticated_user, 'record_successful_login'):
			authenticated_user.record_successful_login()

		refresh = RefreshToken.for_user(authenticated_user)
		access_token = refresh.access_token

		if SESSIONS_TABLE_ENABLED and UserSession:
			try:
				UserSession.objects.create(
					user=authenticated_user,
					session_key=request.session.session_key or "",
					ip_address=_get_client_ip(request),
					user_agent=_get_user_agent(request),
					device_fingerprint="",
					location="",
				)
			except Exception:
				logger.exception("Could not create UserSession")

		if SECURITY_LOGS_ENABLED and SecurityLog:
			SecurityLog.objects.create(
				user=authenticated_user,
				event_type="login_success",
				ip_address=_get_client_ip(request),
				user_agent=_get_user_agent(request),
				session_key=request.session.session_key or "",
			)

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
			secure=_cookie_secure(),
			samesite="Lax",
			path="/",
		)

		logger.info("Successful login for %s from %s", authenticated_user.email, _get_client_ip(request))
		return resp

@method_decorator([csrf_protect, never_cache], name="dispatch")
class RegisterView(APIView):
	"""Registration endpoint that creates user and returns data + tokens"""
	permission_classes = [permissions.AllowAny]
	throttle_classes = [AuthThrottle]

	def post(self, request, *args, **kwargs):
		serializer = UserRegistrationSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		user = serializer.save()

		if hasattr(user, "account_status") and hasattr(User, "AccountStatus"):
			if settings.DEBUG:
				user.account_status = User.AccountStatus.ACTIVE
				user.save(update_fields=["account_status"])

		refresh = RefreshToken.for_user(user)
		access_token = refresh.access_token

		if SESSIONS_TABLE_ENABLED and UserSession:
			try:
				UserSession.objects.create(
					user=user,
					session_key=request.session.session_key or "",
					ip_address=_get_client_ip(request),
					user_agent=_get_user_agent(request),
				)
			except Exception:
				logger.exception("Could not create UserSession on registration")

		if SECURITY_LOGS_ENABLED and SecurityLog:
			SecurityLog.objects.create(
				user=user,
				event_type="login_success",
				ip_address=_get_client_ip(request),
				user_agent=_get_user_agent(request),
				details={"action": "registration"},
				session_key=request.session.session_key or "",
			)

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
			secure=_cookie_secure(),
			samesite="Lax",
			path="/",
		)

		logger.info("New user registered: %s from %s", user.email, _get_client_ip(request))
		return resp

class MeView(APIView):
	"""Get current authenticated user data"""
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		if hasattr(request.user, "update_activity"):
			try:
				request.user.update_activity()
			except Exception:
				pass
		return Response(UserSerializer(request.user).data)

	def patch(self, request, *args, **kwargs):
		serializer = UserSerializer(request.user, data=request.data, partial=True)
		if serializer.is_valid():
			old_data = {
				"first_name": request.user.first_name,
				"last_name": request.user.last_name,
				"phone_number": getattr(request.user, "phone_number", "")
			}

			user = serializer.save()

			if SECURITY_LOGS_ENABLED and SecurityLog:
				SecurityLog.objects.create(
					user=user,
					event_type="profile_update",
					ip_address=_get_client_ip(request),
					user_agent=_get_user_agent(request),
					details={
						"old": old_data,
						"new": serializer.validated_data,
					},
				)

			return Response(UserSerializer(user).data)

		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
	"""Logout and blacklist tokens"""
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")
		if refresh_token:
			try:
				token = RefreshToken(refresh_token)
				token.blacklist()
			except (TokenError, InvalidToken, Exception):
				logger.debug("Refresh token could not be blacklisted")

		if SESSIONS_TABLE_ENABLED and UserSession:
			try:
				UserSession.objects.filter(
					user=request.user,
					session_key=request.session.session_key or "",
					is_active=True,
				).update(is_active=False)
			except Exception:
				pass

		if SECURITY_LOGS_ENABLED and SecurityLog:
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

		resp = Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
		resp.delete_cookie("refresh_token", path="/", samesite="Lax")
		return resp

class ChangePasswordView(APIView):
	"""Change user password"""
	permission_classes = [permissions.IsAuthenticated]
	throttle_classes = [AuthThrottle]

	def post(self, request, *args, **kwargs):
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

		if SESSIONS_TABLE_ENABLED and UserSession:
			try:
				UserSession.objects.filter(user=request.user).exclude(
					session_key=request.session.session_key or ""
				).update(is_active=False)
			except Exception:
				pass

		if SECURITY_LOGS_ENABLED and SecurityLog:
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

		return Response({"detail": "Password changed successfully"}, status=status.HTTP_200_OK)

class UserSessionsView(APIView):
	"""List and manage user sessions"""
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		if not SESSIONS_TABLE_ENABLED or not UserSession:
			return Response([], status=status.HTTP_200_OK)

		sessions = UserSession.objects.filter(user=request.user, is_active=True).order_by("-last_activity")
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
			for s in sessions
		]

		return Response(data, status=status.HTTP_200_OK)

	def delete(self, request, session_id, *args, **kwargs):
		if not SESSIONS_TABLE_ENABLED or not UserSession:
			return Response({"detail": "Sessions not available"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			session = UserSession.objects.get(id=session_id, user=request.user, is_active=True)
		except UserSession.DoesNotExist:
			return Response({"detail": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

		if session.session_key == (request.session.session_key or ""):
			return Response({"detail": "Cannot terminate current session"}, status=status.HTTP_400_BAD_REQUEST)

		session.is_active = False
		session.save(update_fields=["is_active"])

		if SECURITY_LOGS_ENABLED and SecurityLog:
			SecurityLog.objects.create(
				user=request.user,
				event_type="logout",
				ip_address=_get_client_ip(request),
				user_agent=_get_user_agent(request),
				details={"action": "remote_session_termination", "terminated_session_id": session_id},
			)

		return Response({"detail": "Session terminated"}, status=status.HTTP_200_OK)


class CSRFTokenView(APIView):
	"""
	Public endpoint to get/set CSRF token for SPA authentication.
	This ensures the CSRF cookie is set before any POST/PUT/DELETE requests.
	"""
	permission_classes = [permissions.AllowAny]
	
	def get(self, request, *args, **kwargs):
		from django.middleware.csrf import get_token
		token = get_token(request)
		
		response = Response({"csrftoken": token}, status=status.HTTP_200_OK)
		# Ensure we don't cache this response
		response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
		response['Pragma'] = 'no-cache' 
		response['Expires'] = '0'
		return response
