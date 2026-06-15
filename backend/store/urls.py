from django.urls import path
from . import views
from .views import auth_views
from .views import payment_views

urlpatterns = [
    path('register', auth_views.register_view, name='register'),
    path('login', auth_views.login_view, name='login'),
    path('logout', auth_views.logout_view, name='logout'),
    path('refresh', auth_views.refresh_view, name='refresh'),
    path('user', auth_views.me, name='me'),

    # catalog
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

    # orders
    path('orders/', views.get_orders, name='orders'),
    path('orders/<int:pk>/', views.get_order, name='get_order'),
    path('orders/<int:pk>/update/', views.update_order, name='update_order'),
    path('orders/<int:pk>/delete/', views.delete_order, name='delete_order'),
    path('orders/create/', views.create_order, name='create_order'),

    path('payment/<int:order_id>/esewa/checkout', payment_views.esewa_checkout, name='esewa_checkout'),
    path('payment/esewa/confirm', payment_views.esewa_confirm, name='esewa_confirm'),
    #
    path('payment/<int:order_id>/khalti/checkout', payment_views.khalti_checkout, name='khalti_checkout'),
    path('payment/khalti/confirm', payment_views.khalti_confirm, name='khalti_confirm'),
]
