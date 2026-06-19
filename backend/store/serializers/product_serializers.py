from rest_framework import serializers
from ..models import Category, Product
from .shop_serializers import ShopSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    """Read serializer for the public storefront (category nested for display)."""
    category = CategorySerializer(read_only=True)
    shop = serializers.SlugRelatedField(read_only=True, slug_field='slug')

    class Meta:
        model = Product
        fields = '__all__'


class ManageProductSerializer(serializers.ModelSerializer):
    """Write serializer used by shop managers (CRUD).

    `category` is a writable id here, and `shop` is read-only because the view
    assigns it automatically from `request.shop` in perform_create().
    """

    class Meta:
        model = Product
        fields = ['id', 'shop', 'category', 'name', 'description', 'price', 'image', 'created_at']
        read_only_fields = ['shop', 'created_at']
