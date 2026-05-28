from django.conf import settings

from core.settings import (
    DEFAULT_CORS_ALLOWED_ORIGINS,
    missing_required_production_settings,
)


def test_api_defaults_are_private_and_jwt_refresh_is_rotated():
    assert settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] == (
        "rest_framework.permissions.IsAuthenticated",
    )
    assert settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"] is True
    assert settings.SIMPLE_JWT["BLACKLIST_AFTER_ROTATION"] is True


def test_production_security_headers_and_cookie_settings_are_configured():
    assert settings.CORS_ALLOW_CREDENTIALS is False
    assert settings.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert settings.X_FRAME_OPTIONS == "DENY"
    assert settings.SECURE_REFERRER_POLICY == "strict-origin-when-cross-origin"


def test_local_candidate_and_admin_origins_are_allowed_by_default():
    assert "http://localhost:4200" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://127.0.0.1:4200" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://localhost:4201" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://127.0.0.1:4201" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://localhost:4300" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://127.0.0.1:4300" in DEFAULT_CORS_ALLOWED_ORIGINS
    assert "http://localhost:4201" in settings.CORS_ALLOWED_ORIGINS


def test_production_env_guard_requires_explicit_safe_settings():
    missing = missing_required_production_settings(
        {
            "SECRET_KEY": "",
            "DATABASE_URL": "",
            "ALLOWED_HOSTS": "",
            "CORS_ALLOWED_ORIGINS": "",
            "DEBUG": "true",
            "CORS_ALLOW_CREDENTIALS": "true",
        }
    )

    assert missing == [
        "SECRET_KEY",
        "DATABASE_URL",
        "ALLOWED_HOSTS",
        "CORS_ALLOWED_ORIGINS",
        "DEBUG=false",
        "CORS_ALLOW_CREDENTIALS=false",
    ]


def test_production_env_guard_accepts_bearer_jwt_cors_setup():
    missing = missing_required_production_settings(
        {
            "SECRET_KEY": "prod-secret",
            "DATABASE_URL": "postgres://example",
            "ALLOWED_HOSTS": "api.example.com",
            "CORS_ALLOWED_ORIGINS": "https://app.example.com",
            "DEBUG": "false",
            "CORS_ALLOW_CREDENTIALS": "false",
        }
    )

    assert missing == []
