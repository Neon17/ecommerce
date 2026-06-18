from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views.google_auth_views import OAuthLoginView
from . import views
from .views import auth_views
from .views import payment_views
from .views import google_auth_views

urlpatterns = [
    path('register', auth_views.register_view, name='register'),
    path('login', auth_views.login_view, name='login'),
    path('logout', auth_views.logout_view, name='logout'),
    path('refresh', auth_views.refresh_view, name='refresh'),
    path('user', auth_views.me, name='me'),
    path('profile/email', auth_views.update_email, name='update_email'),
    path('profile/password', auth_views.change_password, name='change_password'),
    path('auth/<str:provider>/', OAuthLoginView.as_view(), name='google_login'),

    # JWT (djangorestframework-simplejwt) — React stores these tokens.
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # catalog (public storefront)
    path('products/', views.get_products, name='get_products'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/<int:pk>/', views.get_product, name='get_product'),
    path('categories/<int:pk>/', views.get_category, name='get_category'),

    # cart
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/', views.remove_from_cart),
    path('cart/update/', views.update_cart),
    path('merge-cart/', views.merge_cart, name='merge_cart'),
    path('sync-local-cart/', views.sync_local_cart, name='sync_local_cart'),

    # orders (customer)
    path('orders/', views.get_orders, name='orders'),
    path('orders/<int:pk>/', views.get_order, name='get_order'),
    path('orders/<int:pk>/update/', views.update_order, name='update_order'),
    path('orders/<int:pk>/delete/', views.delete_order, name='delete_order'),
    # Checkout now groups the cart by shop -> 1 master Order + N SubOrders.
    path('orders/create/', views.CheckoutView.as_view(), name='create_order'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    # Master orders with their nested per-shop SubOrders.
    path('my/orders/', views.CustomerOrderListView.as_view(), name='my_orders'),

    # vendor / shop manager (scoped by X-Shop-Slug header)
    path('shop/products/', views.ManageProductListCreateView.as_view(), name='shop_products'),
    path('shop/products/<int:pk>/', views.ManageProductDetailView.as_view(), name='shop_product_detail'),
    path('shop/orders/', views.ShopOrderListView.as_view(), name='shop_orders'),
    path('shop/orders/<int:pk>/', views.ShopOrderUpdateView.as_view(), name='shop_order_update'),

    # admin / owner
    path('admin/orders/', views.get_all_orders, name='admin_orders'),
    path('admin/orders/<int:pk>/status/', views.admin_update_order_status, name='admin_update_order_status'),

    path('payment/<int:order_id>/esewa/checkout', payment_views.esewa_checkout, name='esewa_checkout'),
    path('payment/esewa/confirm', payment_views.esewa_confirm, name='esewa_confirm'),
    #
    path('payment/<int:order_id>/khalti/checkout', payment_views.khalti_checkout, name='khalti_checkout'),
    path('payment/khalti/confirm', payment_views.khalti_confirm, name='khalti_confirm'),
]
