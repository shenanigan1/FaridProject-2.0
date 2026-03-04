from rest_framework.viewsets import ModelViewSet
from recruitment.models.job_application import JobApplication
from recruitment.serializers import JobApplicationSerializer


class JobApplicationViewSet(ModelViewSet):
    queryset = (
        JobApplication.objects.select_related("candidate", "position")
        .all()
        .order_by("id")
    )
    serializer_class = JobApplicationSerializer
