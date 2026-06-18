from rest_framework.permissions import BasePermission


ORDER_MANAGER_GROUP = "Order Managers"
SHOP_MANAGER_GROUP = "Shop Managers"

def is_order_manager(user):
    """True for superusers or members of the 'Order Managers' group."""
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.groups.filter(name=ORDER_MANAGER_GROUP).exists())
    )


def is_shop_manager(user):
    """True if `user` can manage *some* shop.

    Superusers, anyone who owns a Shop (the OneToOne `user.shop`), or members of
    the 'Shop Managers' group. The frontend uses this to decide whether to show
    the vendor dashboard; which shop they act on is still resolved per-request
    from the X-Shop-Slug header / subdomain by ShopContextMiddleware.
    """
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or hasattr(user, 'shop')
            or user.groups.filter(name=SHOP_MANAGER_GROUP).exists()
        )
    )


class IsOrderManager(BasePermission):
    """Allows access only to superusers or members of the 'Order Managers' group."""

    message = "You must be an Order Manager to access this resource."

    def has_permission(self, request, view):
        return is_order_manager(request.user)

class IsShopManager(BasePermission):
    """Allows access only to superusers or members of the 'Shop Managers' group."""

    message = "You must be a Shop Manager to access this resource."

    def has_permission(self, request, view):
        user = request.user
        shop = getattr(request, 'shop', None)

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        if shop and shop.owner == user:
            return True

        return user.groups.filter(name=SHOP_MANAGER_GROUP).exists()

