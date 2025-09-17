"""
ASGI config for valund project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'valund.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django is set up
from django.urls import path, re_path
from django.http import HttpResponse

async def health_check(request):
    """Health check endpoint for monitoring"""
    return HttpResponse("OK", content_type="text/plain")

# Define the application
application = django_asgi_app
