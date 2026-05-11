from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

from users.serializers.auth import LoginSerializer, MeSerializer


def _refresh_cookie_kwargs():
    kwargs = {
        "path": settings.JWT_REFRESH_COOKIE_PATH,
        "secure": settings.JWT_REFRESH_COOKIE_SECURE,
        "httponly": True,
        "samesite": settings.JWT_REFRESH_COOKIE_SAMESITE,
    }
    if settings.JWT_REFRESH_COOKIE_DOMAIN:
        kwargs["domain"] = settings.JWT_REFRESH_COOKIE_DOMAIN
    return kwargs


def _set_refresh_cookie(response, refresh_token):
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        **_refresh_cookie_kwargs(),
    )


def _delete_refresh_cookie(response):
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        domain=settings.JWT_REFRESH_COOKIE_DOMAIN,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
    )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)
        refresh_token = payload.pop("refresh")
        response = Response(payload, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, refresh_token)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data, status=status.HTTP_200_OK)


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(
            settings.JWT_REFRESH_COOKIE_NAME
        )
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        payload = dict(serializer.validated_data)
        next_refresh_token = payload.pop("refresh", None)
        response = Response(payload, status=status.HTTP_200_OK)
        if next_refresh_token:
            _set_refresh_cookie(response, next_refresh_token)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _delete_refresh_cookie(response)
        return response
