from .product_views import get_products, get_categories, get_product, get_category
from .cart_views import get_cart, add_to_cart, remove_from_cart, update_cart, merge_cart, sync_local_cart
from .order_views import (
    get_orders,
    get_order,
    update_order,
    create_order,
    delete_order,
    get_all_orders,
    admin_update_order_status,
)
from .auth_views import register_view
