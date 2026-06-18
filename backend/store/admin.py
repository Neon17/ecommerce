from django.contrib import admin
from .models import Category, Product, UserProfile, Shop, Order, SubOrder, OrderItem, Cart, CartItem

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'payment_method', 'is_paid', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'is_paid', 'payment_method')
    list_editable = ('status',)  # staff can flip paid -> confirmed -> on_road right from the list


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'owner', 'created_at')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(SubOrder)
class SubOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'shop', 'subtotal', 'status', 'created_at')
    list_filter = ('status', 'shop')

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(UserProfile)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)


