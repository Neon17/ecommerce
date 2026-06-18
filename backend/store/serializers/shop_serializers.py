from rest_framework import serializers
from ..models import Shop


class ShopSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'owner', 'owner_username', 'created_at']
        read_only_fields = ['slug', 'owner', 'created_at']
