from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from candidates.models import Candidate
from candidates.serializers import CandidateSerializer
from users.models import UserRoles
from users.permissions import IsHrAdminOrDirector


class CandidateViewSet(ModelViewSet):
    queryset = (
        Candidate.objects.select_related("user", "target_position").all().order_by("id")
    )
    serializer_class = CandidateSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]

        if self.action == "me":
            return [IsAuthenticated()]

        if self.action in ["list", "retrieve", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]

        return [IsAuthenticated()]

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        if request.user.role != UserRoles.CANDIDATE:
            return Response(status=status.HTTP_403_FORBIDDEN)

        candidate = self.get_queryset().filter(user=request.user).first()
        if candidate is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if request.method == "PATCH":
            serializer = self.get_serializer(candidate, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(candidate)
        return Response(serializer.data, status=status.HTTP_200_OK)
