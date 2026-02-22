from rest_framework.viewsets import ModelViewSet
from employees.models import Employee
from employees.serializers import EmployeeSerializer


class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.select_related("user").all().order_by("id")
    serializer_class = EmployeeSerializer