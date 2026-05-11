from django.conf import settings


def test_api_defaults_are_private_and_jwt_refresh_is_rotated():
    assert settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] == (
        "rest_framework.permissions.IsAuthenticated",
    )
    assert settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"] is True
    assert settings.SIMPLE_JWT["BLACKLIST_AFTER_ROTATION"] is True


def test_production_security_headers_and_cookie_settings_are_configured():
    assert settings.CORS_ALLOW_CREDENTIALS is True
    assert settings.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert settings.X_FRAME_OPTIONS == "DENY"
    assert settings.SECURE_REFERRER_POLICY == "strict-origin-when-cross-origin"
    assert settings.JWT_REFRESH_COOKIE_PATH == "/api/auth/"

    if settings.SECURE_SSL_REDIRECT:
        assert settings.JWT_REFRESH_COOKIE_SECURE is True
        assert settings.JWT_REFRESH_COOKIE_SAMESITE == "None"
