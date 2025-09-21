from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer


class MeView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, *args, **kwargs):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)


class LogoutView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		# Stateless JWT: nothing to revoke server-side unless using token blacklist
		resp = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
		# Clear refresh cookie if present (set by identity views)
		resp.delete_cookie("refresh_token", path="/")
		return resp
