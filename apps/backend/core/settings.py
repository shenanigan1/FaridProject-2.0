import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")  # Explicitly load .env for pytest

SECRET_KEY = "dev-secret-key"
DEBUG = True
ALLOWED_HOSTS = []


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

AUTH_USER_MODEL = "users.User"

INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_filters",
    "rest_framework",
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

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://localhost:4201",
    "http://127.0.0.1:4201",
]

# if you want to allow coockies and sessions
# CORS_ALLOW_CREDENTIALS = True

AUTHENTICATION_BACKENDS = [
    "core.auth_backend.EmailAuthBackend",
]

ROOT_URLCONF = "core.urls"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "farid_db"),
        "USER": os.getenv("DB_USER", "farid"),
        "PASSWORD": os.getenv("DB_PASSWORD", "farid1234"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5433"),
    }
}

print("ENV DB_HOST:", os.getenv("DB_HOST"))
print("ENV DB_PORT:", os.getenv("DB_PORT"))
print("ENV DB_USER:", os.getenv("DB_USER"))
print("ENV DB_NAME:", os.getenv("DB_NAME"))
print("ENV DB_PASSWORD is None?:", os.getenv("DB_PASSWORD") is None)

STATIC_URL = "/static/"
