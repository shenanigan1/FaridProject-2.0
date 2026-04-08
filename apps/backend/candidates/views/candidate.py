from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from candidates.models import Candidate
from candidates.serializers import CandidateSerializer
from users.permissions import IsHrAdminOrDirector


class CandidateViewSet(ModelViewSet):
    queryset = (
        Candidate.objects.select_related("user", "target_position").all().order_by("id")
    )
    serializer_class = CandidateSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]

        if self.action in ["list", "retrieve", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]

        return [IsAuthenticated()]
