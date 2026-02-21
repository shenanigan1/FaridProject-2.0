from django.db.models import Q
from rest_framework.viewsets import ModelViewSet

from candidates.models import Candidate
from candidates.serializers import CandidateSerializer


class CandidateViewSet(ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer

    @staticmethod
    def _has_field(field_name: str) -> bool:
        try:
            Candidate._meta.get_field(field_name)
            return True
        except Exception:
            return False

    def get_queryset(self):
        queryset = super().get_queryset()

        status_value = self.request.query_params.get("status")
        if status_value is not None and self._has_field("status"):
            queryset = queryset.filter(status=status_value)

        flag_value = self.request.query_params.get("flag")
        if flag_value is not None and self._has_field("flag"):
            normalized_flag = flag_value.strip().lower()
            if normalized_flag in {"true", "1", "yes"}:
                queryset = queryset.filter(flag=True)
            elif normalized_flag in {"false", "0", "no"}:
                queryset = queryset.filter(flag=False)

        search_value = self.request.query_params.get("search")
        if search_value:
            filters = Q()

            for field_name in ("first_name", "last_name", "email"):
                if self._has_field(field_name):
                    filters |= Q(**{f"{field_name}__icontains": search_value})

            if search_value.isdigit() and self._has_field("id"):
                filters |= Q(id=int(search_value))

            queryset = queryset.filter(filters)

        return queryset
