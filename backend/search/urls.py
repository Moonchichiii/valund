"""
URL configuration for search app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'search'

# API router for viewsets
router = DefaultRouter()

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]