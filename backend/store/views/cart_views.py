from django.http import HttpRequest
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from ..cart_utils import get_or_create_cart
from ..models import Product, Cart, CartItem
from ..serializers import CartSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request: HttpRequest):
    cart = get_or_create_cart(request)
    return Response(CartSerializer(cart).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart(request: HttpRequest):
    quantity_raw = request.data.get('quantity')
    if quantity_raw is None or not str(quantity_raw).isdigit() or int(quantity_raw) < 1:
        return Response({'error': 'Invalid quantity'}, status=400)

    product_id_raw = request.data.get('product_id')
    if not product_id_raw or not str(product_id_raw).isdigit():
        return Response({'error': 'Invalid product_id'}, status=400)

    product_id = int(product_id_raw)
    quantity = int(quantity_raw)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart = get_or_create_cart(request)
    cart_item = CartItem.objects.filter(cart=cart, product=product).first()
    if not cart_item:
        return Response({'error': 'Cart item not found'}, status=404)

    cart_item.quantity = int(quantity)
    cart_item.save()

    return Response(CartSerializer(cart).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request: HttpRequest):
    product_id = request.data.get('product_id')
    quantity_raw = request.data.get('quantity', 1)

    try:
        quantity = int(quantity_raw)
        if quantity < 0:
            return Response({'error': 'Quantity must be positive'}, status=400)
    except (TypeError, ValueError):
        return Response({'error': 'Invalid quantity'}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart = get_or_create_cart(request)
    # `defaults={'quantity': 0}` so a brand-new item starts empty and the line
    # below sets it to exactly `quantity` — without it the model default of 1
    # would make the first "add" land 2 in the cart.
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart, product=product, defaults={'quantity': 0},
    )
    cart_item.quantity += int(quantity)
    if cart_item.quantity <= 0:
        cart_item.delete()
    else:
        cart_item.save()

    return Response(CartSerializer(cart).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request: HttpRequest):
    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart = get_or_create_cart(request)
    CartItem.objects.filter(cart=cart, product=product).delete()
    return Response(CartSerializer(cart).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_local_cart(request):
    items = request.data.get('items', [])  # list of {product_id, quantity}
    user_cart, _ = Cart.objects.get_or_create(user=request.user)

    for item in items:
        product_id = item.get('product_id')
        quantity = int(item.get('quantity', 1))
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            continue
        cart_item, created = CartItem.objects.get_or_create(cart=user_cart, product=product)
        if created:
            cart_item.quantity = quantity
        else:
            cart_item.quantity += quantity
        cart_item.save()

    return Response(CartSerializer(user_cart).data)
