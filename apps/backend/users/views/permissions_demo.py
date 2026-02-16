from rest_framework.views import APIView
from rest_framework.response import Response

from users.permissions.roles import IsAdmin, IsHR


class AdminOnlyView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({"message": "admin ok"})


class HROnlyView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        return Response({"message": "hr ok"})
