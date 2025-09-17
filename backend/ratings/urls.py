"""
URL configuration for ratings app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'ratings'

# API router for viewsets
router = DefaultRouter()

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]