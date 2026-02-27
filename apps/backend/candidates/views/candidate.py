from rest_framework.viewsets import ModelViewSet
from candidates.models import Candidate
from candidates.serializers import CandidateSerializer


class CandidateViewSet(ModelViewSet):
    queryset = (
        Candidate.objects.select_related("user", "target_position").all().order_by("id")
    )
    serializer_class = CandidateSerializer
