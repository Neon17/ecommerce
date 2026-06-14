from django.contrib import admin
from .models import Category, Product, UserProfile, Order, OrderItem, Cart, CartItem

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'payment_method', 'is_paid', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'is_paid', 'payment_method')
    list_editable = ('status',)  # staff can flip paid -> confirmed -> on_road right from the list

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(UserProfile)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)


