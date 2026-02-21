from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.serializers.login import LoginSerializer


class LoginView(APIView):
    """Handle user login and return JWT tokens."""

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            from rest_framework_simplejwt.tokens import RefreshToken
        except ImportError:
            return Response(
                {"detail": "JWT authentication backend is not installed."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )
