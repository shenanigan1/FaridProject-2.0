from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from recruitment.models.job_application import JobApplication
from recruitment.serializers import JobApplicationSerializer
from users.models import UserRoles
from users.permissions import IsHrAdminOrDirector


class JobApplicationViewSet(ModelViewSet):
    queryset = (
        JobApplication.objects.select_related("candidate", "position")
        .all()
        .order_by("id")
    )
    serializer_class = JobApplicationSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        if user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}:
            return queryset

        if user.role == UserRoles.CANDIDATE and hasattr(user, "candidate_profile"):
            return queryset.filter(candidate=user.candidate_profile)

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}:
            serializer.save()
            return

        if user.role != UserRoles.CANDIDATE or not hasattr(user, "candidate_profile"):
            raise PermissionDenied("You are not allowed to create job applications.")

        if serializer.validated_data["candidate"].id != user.candidate_profile.id:
            raise PermissionDenied("You can only apply using your own candidate profile.")

        serializer.save()
