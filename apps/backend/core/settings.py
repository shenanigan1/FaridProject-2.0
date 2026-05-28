import os
from pathlib import Path
from datetime import timedelta
from collections.abc import Mapping

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# =============================================================================
# BASE CONFIG
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

# =============================================================================
# SECURITY
# =============================================================================

SECRET_KEY = os.getenv("SECRET_KEY")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"
IS_PRODUCTION = os.getenv("DJANGO_ENV", "").lower() in {"prod", "production"}


def comma_separated_env(name: str, default: str = "") -> list[str]:
    return [
        value.strip() for value in os.getenv(name, default).split(",") if value.strip()
    ]


ALLOWED_HOSTS = comma_separated_env(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.onrender.com",
)

# =============================================================================
# APPLICATIONS
# =============================================================================

INSTALLED_APPS = [
    # Third party
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    # Django
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Local apps
    "candidates",
    "companies",
    "driver_tests",
    "employees",
    "evaluations",
    "positions",
    "recruitment",
    "templates_grid",
    "users",
]

# =============================================================================
# MIDDLEWARE
# =============================================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
]

# =============================================================================
# AUTHENTICATION
# =============================================================================

AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "core.auth_backend.EmailAuthBackend",
]

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

# =============================================================================
# JWT
# =============================================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

JWT_REFRESH_COOKIE_NAME = os.getenv("JWT_REFRESH_COOKIE_NAME", "ff_refresh")
JWT_REFRESH_COOKIE_PATH = os.getenv("JWT_REFRESH_COOKIE_PATH", "/api/auth/")
JWT_REFRESH_COOKIE_SECURE = (
    os.getenv("JWT_REFRESH_COOKIE_SECURE", str(not DEBUG)).lower() == "true"
)
JWT_REFRESH_COOKIE_SAMESITE = os.getenv(
    "JWT_REFRESH_COOKIE_SAMESITE", "None" if not DEBUG else "Lax"
)
JWT_REFRESH_COOKIE_DOMAIN = os.getenv("JWT_REFRESH_COOKIE_DOMAIN") or None

# =============================================================================
# URLS
# =============================================================================

ROOT_URLCONF = "core.urls"

# =============================================================================
# CORS
# =============================================================================

DEFAULT_CORS_ALLOWED_ORIGINS = (
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://localhost:4201",
    "http://127.0.0.1:4201",
    "http://localhost:4300",
    "http://127.0.0.1:4300",
)

CORS_ALLOWED_ORIGINS = comma_separated_env(
    "CORS_ALLOWED_ORIGINS",
    ",".join(DEFAULT_CORS_ALLOWED_ORIGINS),
)
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "False").lower() == "true"
CSRF_TRUSTED_ORIGINS = [
    origin
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# =============================================================================
# SECURITY HEADERS
# =============================================================================

SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False").lower() == "true"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = int(
    os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "31536000")
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = (
    os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", str(not DEBUG)).lower() == "true"
)
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", str(not DEBUG)).lower() == "true"
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = (
    os.getenv("SESSION_COOKIE_SECURE", str(not DEBUG)).lower() == "true"
)
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", str(not DEBUG)).lower() == "true"
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", JWT_REFRESH_COOKIE_SAMESITE)
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# =============================================================================
# DATABASE
# =============================================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    database_ssl_require = os.getenv("DATABASE_SSL_REQUIRE", "True").lower() == "true"
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=database_ssl_require,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

# =============================================================================
# STATIC FILES
# =============================================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# =============================================================================
# DEFAULTS
# =============================================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


def missing_required_production_settings(env: Mapping[str, str]) -> list[str]:
    missing = [
        name
        for name in (
            "SECRET_KEY",
            "DATABASE_URL",
            "ALLOWED_HOSTS",
            "CORS_ALLOWED_ORIGINS",
        )
        if not env.get(name)
    ]

    if env.get("DEBUG", "False").lower() == "true":
        missing.append("DEBUG=false")

    if env.get("CORS_ALLOW_CREDENTIALS", "False").lower() == "true":
        missing.append("CORS_ALLOW_CREDENTIALS=false")

    return missing


if IS_PRODUCTION:
    missing_settings = missing_required_production_settings(os.environ)
    if missing_settings:
        raise ImproperlyConfigured(
            "Missing or unsafe production settings: " + ", ".join(missing_settings)
        )
