"""
Django settings for valund project.

A competence marketplace platform with Django 5 backend.
Clean single file approach with python-decouple.
"""

import sys
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# Provide a default for local/dev & test runs so commands and pytest don't fail if not set.
SECRET_KEY = config("SECRET_KEY", default="insecure-test-key-change-me")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=True, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Testing mode detection - when pytest is running
TESTING = "pytest" in sys.modules or "test" in sys.argv


# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "django_celery_beat",
    "django_celery_results",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
    "django_prometheus",
    # PROD: If you add django-csp, uncomment the CSP block below in this file.
    # "csp",
]

LOCAL_APPS = [
    "accounts",
    "competence",
    "search",
    "bookings",
    "payments",
    "ratings",
    "contracts",
    "identity",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

SITE_ID = 1

# Allauth (modern settings, keep username-less email login)
ACCOUNT_LOGIN_METHODS = {"email"}  # Only email login (no username login form)
ACCOUNT_SIGNUP_FIELDS = [
    "email*",
    "password1*",
    "password2*",
]
# Default: optional in dev; tighten in prod if desired.
ACCOUNT_EMAIL_VERIFICATION = "optional"  # PROD: consider "mandatory"
SOCIALACCOUNT_QUERY_EMAIL = True
SOCIALACCOUNT_EMAIL_VERIFICATION = "none"  # rely on primary account flow
LOGIN_REDIRECT_URL = "/"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

MIDDLEWARE = [
    # Prometheus before other middlewares to time as much as possible
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "valund.middleware.EnsureCSRFCookieOnSafeMethodsMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Prometheus after middleware for DB / cache metrics finalization
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "valund.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "valund.wsgi.application"
ASGI_APPLICATION = "valund.asgi.application"

# Database configuration
if TESTING:
    # Fast in-memory database for tests
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

    # Disable migrations for faster tests
    class DisableMigrations:
        def __contains__(self, item):
            return True

        def __getitem__(self, item):
            return None

    MIGRATION_MODULES = DisableMigrations()

else:
    # Regular database configuration
    DATABASE_URL = config("DATABASE_URL", default="sqlite:///db.sqlite3")

    if DATABASE_URL.startswith("postgresql"):
        # PostgreSQL configuration for production
        import dj_database_url

        DATABASES = {"default": dj_database_url.parse(DATABASE_URL)}
    else:
        # SQLite for development
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }

# Cache configuration
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")

if TESTING:
    # Dummy cache for tests
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        }
    }
else:
    # Redis cache for development/production
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
            "KEY_PREFIX": "valund",
            "TIMEOUT": 300,
        }
    }

# Celery Configuration
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default=REDIS_URL.replace("/0", "/1"))
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "django-cache"
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "UTC"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Testing mode: run tasks synchronously
if TESTING:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# Password validation
if TESTING:
    # Fast password hashing for tests
    PASSWORD_HASHERS = [
        "django.contrib.auth.hashers.MD5PasswordHasher",
    ]
else:
    # Secure password validation (strengthened)
    AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
            "OPTIONS": {"max_similarity": 0.7},
        },
        {
            "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
            "OPTIONS": {"min_length": 12},  # was 8
        },
        {
            "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
        },
        {
            "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
        },
    ]

# Custom user model
AUTH_USER_MODEL = "accounts.User"

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files and media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/hour", "user": "1000/hour"},
}

# Ultra-Secure JWT Configuration (merged & safe for dev)
SIMPLE_JWT = {
    # shorter access lifetime for security (you had 60m)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    # crypto
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": "valunds.com",  # harmless in dev
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    # header/claims
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    # sliding (optional, present but not used unless you enable sliding views)
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=30),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    # serializers (defaults shown explicitly)
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
}

# CORS settings
# Keep local dev defaults; allow prod domains via env easily.
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    # include local dev + (optionally) prod domains
    default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://valunds.se,https://www.valunds.se",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins (safe in dev; used by Django when DEBUG=False too)
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
     default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://valunds.se,https://www.valunds.se",
    cast=Csv(),
)

# CSRF cookie settings for SPA integration
CSRF_COOKIE_SECURE = not DEBUG  # Only send over HTTPS in production
CSRF_COOKIE_HTTPONLY = False    # Allow JavaScript access for SPA
CSRF_COOKIE_SAMESITE = 'Lax'    # Balance between security and functionality 
CSRF_COOKIE_AGE = 3600          # 1 hour
CSRF_USE_SESSIONS = True        # Use sessions for CSRF tokens

# Session Security (safe now; auto-hardens in prod)
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# Security headers (safe to enable now)
SECURE_CONTENT_TYPE_NOSNIFF = True
# Note: SECURE_BROWSER_XSS_FILTER is obsolete in modern browsers but harmless:
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# Extra security hardening that auto-enables in prod
SECURE_SSL_REDIRECT = not DEBUG             # PROD: True when DEBUG=False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0  # PROD: 1 year HSTS
SECURE_HSTS_INCLUDE_SUBDOMAINS = True       # PROD: meaningful with HSTS
SECURE_HSTS_PRELOAD = True                  # PROD: meaningful with HSTS
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# (Optional) Permissions-Policy — Django doesn’t set this by default.
# If you want this header, add a tiny custom middleware or use a package.
SECURE_PERMISSIONS_POLICY = {
    "geolocation": [],
    "microphone": [],
    "camera": [],
    "payment": ["self"],
    "usb": [],
}

# API Documentation
SPECTACULAR_SETTINGS = {
    "TITLE": "Valund API",
    "DESCRIPTION": "Competence marketplace platform API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Rate Limiting (django-ratelimit)
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = "default"
# Example usage: @ratelimit(key="ip", rate="5/m", block=True) on login views

# Stripe Configuration
if TESTING:
    # Fake Stripe keys for testing
    STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
    STRIPE_SECRET_KEY = "sk_test_fake"
    STRIPE_WEBHOOK_SECRET = "whsec_test_fake"
else:
    # Real Stripe configuration
    STRIPE_PUBLISHABLE_KEY = config("STRIPE_PUBLISHABLE_KEY", default="")
    STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="")
    STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")

# Sentry Configuration
SENTRY_DSN = config("SENTRY_DSN", default="")
if SENTRY_DSN and not TESTING:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(auto_enabling=True),
            CeleryIntegration(monitor_beat_tasks=True),
        ],
        traces_sample_rate=0.1,
        send_default_pii=True,
    )

# Email configuration
if TESTING:
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
elif DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = config("EMAIL_HOST", default="")
    EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")

# Logging
if TESTING:
    # Minimal logging for tests
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "WARNING",
        },
    }
else:
    # Full logging for development/production
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
                "style": "{",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "level": config("DJANGO_LOG_LEVEL", default="INFO"),
                "propagate": False,
            },
            "valund": {
                "handlers": ["console"],
                "level": "DEBUG" if DEBUG else "INFO",
                "propagate": False,
            },
        },
    }

# --- Optional tightenings & prod-only switches ------------------------------

# Login protection paths (compatible with your setup)
LOGIN_URL = "/auth/login/"
LOGIN_REDIRECT_URL = "/"           # keep as-is; change if you add /dashboard
LOGOUT_REDIRECT_URL = "/"

# Allauth stricter account policy (keep modern style, shown as comments)
# PROD: enforce verification via ACCOUNT_EMAIL_VERIFICATION="mandatory" above
# PROD: You already enforce email-only login with ACCOUNT_LOGIN_METHODS={"email"}

# Content Security Policy (requires django-csp if you enable it)
# if not DEBUG:
#     CSP_DEFAULT_SRC = ("'self'",)
#     CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://js.stripe.com")
#     CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
#     CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
#     CSP_IMG_SRC = ("'self'", "data:", "https:")
#     CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")
#     CSP_FRAME_SRC = ("https://js.stripe.com",)

# BankID Security (harmless in dev)
BANKID_TEST_MODE = DEBUG
BANKID_CERT_PATH = config("BANKID_CERT_PATH", default="")
BANKID_KEY_PATH = config("BANKID_KEY_PATH", default="")
BANKID_CA_CERT_PATH = config("BANKID_CA_CERT_PATH", default="")

# Audit Logging (wire this into your logging or signals where needed)
AUDIT_LOG_ENABLED = True
AUDIT_LOG_SENSITIVE_FIELDS = ["password", "token", "secret"]
