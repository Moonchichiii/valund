"""ASGI config for valund project."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "valund.settings")

# Expose the ASGI application
application = get_asgi_application()
