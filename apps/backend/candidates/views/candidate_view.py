from django.db.models import Q
from rest_framework.viewsets import ModelViewSet

from candidates.models import Candidate
from candidates.serializers import CandidateSerializer


class CandidateViewSet(ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        status_value = self.request.query_params.get("status")
        if status_value is not None:
            queryset = queryset.filter(status=status_value)

        flag_value = self.request.query_params.get("flag")
        if flag_value is not None:
            normalized_flag = flag_value.strip().lower()
            if normalized_flag in {"true", "1", "yes"}:
                queryset = queryset.filter(flag=True)
            elif normalized_flag in {"false", "0", "no"}:
                queryset = queryset.filter(flag=False)

        search_value = self.request.query_params.get("search")
        if search_value:
            filters = (
                Q(first_name__icontains=search_value)
                | Q(last_name__icontains=search_value)
                | Q(email__icontains=search_value)
            )

            if search_value.isdigit():
                filters |= Q(id=int(search_value))

            queryset = queryset.filter(filters)

        return queryset
