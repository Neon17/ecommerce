from rest_framework import serializers
from django.contrib.auth.models import User
from ..permissions import is_order_manager

class UserSerializer(serializers.ModelSerializer):
    # True for superusers or members of the "Order Managers" group. The frontend
    # uses this to decide whether to show the admin dashboard.
    is_order_manager = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff', 'is_superuser', 'is_order_manager']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }

    def get_is_order_manager(self, obj):
        return is_order_manager(obj)

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
