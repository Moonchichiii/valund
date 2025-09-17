"""
URL configuration for payments app.
"""

from django.urls import path, include
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter

app_name = 'payments'

# API router for viewsets
router = DefaultRouter()

urlpatterns = [
    # Stripe webhook endpoint (no authentication required)
    path('stripe/webhook/', lambda request: HttpResponse('OK'), name='stripe_webhook'),
    
    # Include router URLs
    path('', include(router.urls)),
]