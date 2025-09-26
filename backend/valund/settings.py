import sys
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# ------------------------------------------------------------------------------
# Core
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config("SECRET_KEY", default="insecure-test-key-change-me")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())
TESTING = "pytest" in sys.modules or "test" in sys.argv
SITE_ID = 1


# ------------------------------------------------------------------------------
# Applications
# ------------------------------------------------------------------------------
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
    "rest_framework_simplejwt.token_blacklist",
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


# ------------------------------------------------------------------------------
# Authentication & Accounts
# ------------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = "optional"
SOCIALACCOUNT_QUERY_EMAIL = True
SOCIALACCOUNT_EMAIL_VERIFICATION = "none"

LOGIN_URL = "/auth/login/"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "valund.middleware.EnsureCSRFCookieOnSafeMethodsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "valund.urls"
WSGI_APPLICATION = "valund.wsgi.application"
ASGI_APPLICATION = "valund.asgi.application"


# ------------------------------------------------------------------------------
# Templates
# ------------------------------------------------------------------------------
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


# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------
if TESTING:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}

    class DisableMigrations:
        def __contains__(self, item): return True
        def __getitem__(self, item): return None

    MIGRATION_MODULES = DisableMigrations()
else:
    DATABASE_URL = config("DATABASE_URL", default="sqlite:///db.sqlite3")
    if DATABASE_URL.startswith("postgresql"):
        import dj_database_url
        DATABASES = {"default": dj_database_url.parse(DATABASE_URL)}
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }


# ------------------------------------------------------------------------------
# Cache
# ------------------------------------------------------------------------------
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")

if TESTING:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}
else:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
            "KEY_PREFIX": "valund",
            "TIMEOUT": 300,
        }
    }


# ------------------------------------------------------------------------------
# Celery
# ------------------------------------------------------------------------------
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default=REDIS_URL.replace("/0", "/1"))
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "django-cache"
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "UTC"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

if TESTING:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True


# ------------------------------------------------------------------------------
# Passwords & Validators
# ------------------------------------------------------------------------------
if TESTING:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
else:
    AUTH_PASSWORD_VALIDATORS = [
        {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator", "OPTIONS": {"max_similarity": 0.7}},
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]


# ------------------------------------------------------------------------------
# Internationalization
# ------------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ------------------------------------------------------------------------------
# Static & Media
# ------------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ------------------------------------------------------------------------------
# DRF & OpenAPI
# ------------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/hour", "user": "1000/hour"},
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Valund API",
    "DESCRIPTION": "Competence marketplace platform API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# ------------------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "ISSUER": "valunds.com",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=30),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
}


# ------------------------------------------------------------------------------
# Security Headers
# ------------------------------------------------------------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

SECURE_SSL_REDIRECT = not DEBUG
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

SECURE_PERMISSIONS_POLICY = {
    "geolocation": [],
    "microphone": [],
    "camera": [],
    "payment": ["self"],
    "usb": [],
}

# Keep CSP scaffold for future hardening (intentionally commented)
# if not DEBUG:
#     CSP_DEFAULT_SRC = ("'self'",)
#     CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://js.stripe.com")
#     CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
#     CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
#     CSP_IMG_SRC = ("'self'", "data:", "https:")
#     CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")
#     CSP_FRAME_SRC = ("https://js.stripe.com",)


# ------------------------------------------------------------------------------
# Sessions
# ------------------------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# Cross-site session cookies
if DEBUG:
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
else:
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True


# ------------------------------------------------------------------------------
# CSRF & CORS (Consolidated)
# ------------------------------------------------------------------------------
# Remove duplicate/conflicting CSRF settings and consolidate
# CSRF configuration for cross-origin SPA
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False  # Must be False so axios can read it
CSRF_COOKIE_SAMESITE = "Lax" if DEBUG else "None"
CSRF_COOKIE_SECURE = not DEBUG  # False in dev, True in prod
CSRF_USE_SESSIONS = False  # Use cookies, not sessions
CSRF_COOKIE_AGE = 3600  # 1 hour

# CORS must allow credentials for CSRF to work
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://valunds.se",
    "https://www.valunds.se",
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS


# ------------------------------------------------------------------------------
# Rate limiting
# ------------------------------------------------------------------------------
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = "default"


# ------------------------------------------------------------------------------
# Payments (Stripe)
# ------------------------------------------------------------------------------
if TESTING:
    STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
    STRIPE_SECRET_KEY = "sk_test_fake"
    STRIPE_WEBHOOK_SECRET = "whsec_test_fake"
else:
    STRIPE_PUBLISHABLE_KEY = config("STRIPE_PUBLISHABLE_KEY", default="")
    STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="")
    STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")


# ------------------------------------------------------------------------------
# Error monitoring (Sentry)
# ------------------------------------------------------------------------------
SENTRY_DSN = config("SENTRY_DSN", default="")
if SENTRY_DSN and not TESTING:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(auto_enabling=True), CeleryIntegration(monitor_beat_tasks=True)],
        traces_sample_rate=0.1,
        send_default_pii=True,
    )


# ------------------------------------------------------------------------------
# Email
# ------------------------------------------------------------------------------
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


# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------
if TESTING:
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {"console": {"class": "logging.StreamHandler"}},
        "root": {"handlers": ["console"], "level": "WARNING"},
    }
else:
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {"format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}", "style": "{"},
        },
        "handlers": {
            "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
        },
        "root": {"handlers": ["console"], "level": "INFO"},
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


# ------------------------------------------------------------------------------
# BankID
# ------------------------------------------------------------------------------
BANKID_TEST_MODE = DEBUG
BANKID_CERT_PATH = config("BANKID_CERT_PATH", default="")
BANKID_KEY_PATH = config("BANKID_KEY_PATH", default="")
BANKID_CA_CERT_PATH = config("BANKID_CA_CERT_PATH", default="")


# ------------------------------------------------------------------------------
# Auditing
# ------------------------------------------------------------------------------
AUDIT_LOG_ENABLED = True
AUDIT_LOG_SENSITIVE_FIELDS = ["password", "token", "secret"]
