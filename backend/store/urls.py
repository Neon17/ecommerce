from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', views.register_view),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('products/', views.get_products, name='get_products'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/<int:pk>/', views.get_product, name='get_product'),
    path('categories/<int:pk>/', views.get_category, name='get_category'),
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/', views.remove_from_cart),
    path('cart/update/', views.update_cart),
    path('orders/', views.get_orders, name='orders'),
    path('orders/<int:pk>/', views.get_order, name='get_order'),
    path('orders/<int:pk>/update/', views.update_order, name='update_order'),
    path('orders/create/', views.create_order, name='create_order'),
    path('merge-cart/', views.merge_cart, name='merge_cart'),
    path('sync-local-cart/', views.sync_local_cart, name='sync_local_cart'),
]