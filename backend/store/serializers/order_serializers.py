from rest_framework import serializers
from ..models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    PAYMENT_CHOICES = [
        ('COD', 'Cash on Delivery (COD)'),
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti')
    ]

    payment_method = serializers.ChoiceField(choices=PAYMENT_CHOICES)
    items = OrderItemSerializer(many=True, read_only=True)
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
