from rest_framework import serializers
from ..models import Order, SubOrder, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']


class SubOrderSerializer(serializers.ModelSerializer):
    """A shop's slice of a master order, with its line items nested."""
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SubOrder
        fields = ['id', 'order', 'shop', 'shop_name', 'subtotal', 'status', 'items', 'created_at']
        # Managers may only change `status`; everything else is set at checkout.
        read_only_fields = ['order', 'shop', 'subtotal', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    # Flat item list kept for backward-compat with existing screens...
    items = OrderItemSerializer(many=True, read_only=True)
    # ...plus the per-shop breakdown the customer order view nests.
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def validate_phone(self, value):
        if value and len(value) != 10:
            raise serializers.ValidationError("Invalid phone number. Must be exactly 10 digits.")
        return value

    def validate_name(self, value):
        if value and len(value) <= 0:
            raise serializers.ValidationError("Invalid name. Must be at least 1 character.")
        return value
