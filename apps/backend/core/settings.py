import os
from pathlib import Path
from datetime import timedelta

import dj_database_url
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

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.onrender.com",
).split(",")

# =============================================================================
# APPLICATIONS
# =============================================================================

INSTALLED_APPS = [
    # Third party
    "corsheaders",
    "django_filters",
    "rest_framework",
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

# =============================================================================
# URLS
# =============================================================================

ROOT_URLCONF = "core.urls"

# =============================================================================
# CORS
# =============================================================================

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:4200,http://127.0.0.1:4200",
).split(",")

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
