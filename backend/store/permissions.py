from rest_framework.permissions import BasePermission


ORDER_MANAGER_GROUP = "Order Managers"


def is_order_manager(user):
    """True for superusers or members of the 'Order Managers' group."""
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.groups.filter(name=ORDER_MANAGER_GROUP).exists())
    )


class IsOrderManager(BasePermission):
    """Allows access only to superusers or members of the 'Order Managers' group."""

    message = "You must be an Order Manager to access this resource."

    def has_permission(self, request, view):
        return is_order_manager(request.user)
