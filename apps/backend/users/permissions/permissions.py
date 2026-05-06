# from rest_framework.permissions import BasePermission
# from users.models.roles import UserRoles  # :contentReference[oaicite:0]{index=0}

# class IsHrAdminOrDirector(BasePermission):
#     message = "You do not have permission to perform this action."

#     def has_permission(self, request, view):
#         user = request.user
#         if not user or not user.is_authenticated:
#             return False
#         return user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}
