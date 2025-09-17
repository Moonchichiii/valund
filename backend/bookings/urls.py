"""
URL configuration for bookings app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'bookings'

# API router for viewsets
router = DefaultRouter()

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]