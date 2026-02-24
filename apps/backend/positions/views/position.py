from rest_framework.viewsets import ModelViewSet
from positions.models import Position
from positions.serializers import PositionSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.permissions import IsHrAdminOrDirector


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.select_related("company").all().order_by("id")
    serializer_class = PositionSerializer
    
    def get_permissions(self):
        # Backoffice app: usually authenticated list/retrieve
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]

        # Only HR/Admin/Director can create/update/delete
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]

        return [IsAuthenticated()]