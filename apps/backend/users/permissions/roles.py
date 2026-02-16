from rest_framework.permissions import BasePermission
from users.models import UserRoles


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRoles.ADMIN


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRoles.HR


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRoles.MANAGER


class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRoles.DIRECTOR
