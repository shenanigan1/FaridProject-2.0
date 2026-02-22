from rest_framework.viewsets import ModelViewSet
from companies.models import Company
from companies.serializers import CompanySerializer


class CompanyViewSet(ModelViewSet):
    queryset = Company.objects.all().order_by("id")
    serializer_class = CompanySerializer