from rest_framework.permissions import BasePermission
from users.models import UserRoles


class HasAnyRole(BasePermission):
    allowed_roles: set[str] = set()

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class IsHrAdminOrDirector(HasAnyRole):
    allowed_roles = {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}


class IsManager(HasAnyRole):
    allowed_roles = {UserRoles.MANAGER}


class IsCandidate(HasAnyRole):
    allowed_roles = {UserRoles.CANDIDATE}


class IsAdmin(HasAnyRole):
    allowed_roles = {UserRoles.ADMIN}
