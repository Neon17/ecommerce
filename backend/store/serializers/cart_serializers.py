from rest_framework import serializers
from ..models import Cart, CartItem

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'

class CartSerializer(serializers.ModelSerializer):
    # Ordered by id so the cart never reshuffles between requests — otherwise the
    # drawer reorders on every add/update and looks like items are jumping around.
    items = serializers.SerializerMethodField()
    total = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = '__all__'

    def get_items(self, obj):
        return CartItemSerializer(obj.items.order_by('id'), many=True).data
