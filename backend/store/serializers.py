from rest_framework import serializers
from .models import Category, Product, Cart, CartItem, Order
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError('Passwords must match.')
        return data

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password1']
        user = User.objects.create_user(username=username, email=email, password=password)
        return user

class OrderSerializer(serializers.ModelSerializer):
    PAYMENT_CHOICES = [
        ('COD', 'Cash on Delivery (COD)'),
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti')
    ]

    payment_method = serializers.ChoiceField(choices=PAYMENT_CHOICES)

    class Meta:
        model = Order
        fields = '__all__'

    def validate_phone(self, value):
        if value and len(value) != 10:
            raise serializers.ValidationError("Invalid phone number. Must be exactly 10 digits.")
        return value
