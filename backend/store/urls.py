from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.get_products, name='get_products'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/<int:pk>/', views.get_product, name='get_product'),
    path('categories/<int:pk>/', views.get_category, name='get_category')
]