from rest_framework.viewsets import ModelViewSet
from positions.models import Position
from positions.serializers import PositionSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.permissions import IsHrAdminOrDirector
<<<<<<< Updated upstream
=======
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet
>>>>>>> Stashed changes


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.select_related("company").all().order_by("id")
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]

        return [IsAuthenticated()]
<<<<<<< Updated upstream
=======

class PublicPositionViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Position.objects
            .filter(is_active=True)
            .select_related("company")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PublicPositionSerializer
        return PublicPositionSerializer
>>>>>>> Stashed changes
