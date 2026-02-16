from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from candidates.models import Candidate
from candidates.serializers import CandidateSerializer

class CandidateViewSet(ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    
    # search + filter 
    filter_backends = [SearchFilter, DjangoFilterBackend] 
    # search by text fields
    search_fields = ["first_name", "last_name", "email", "id"] 
    # exact match
    filterset_fields = ["status", "flag"]
