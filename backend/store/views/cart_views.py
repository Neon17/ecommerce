from django.http import HttpRequest
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from ..cart_utils import get_or_create_cart, set_cart_session_cookie
from ..models import Product, Cart, CartItem
from ..serializers import CartSerializer


@api_view(['GET'])
def get_cart(request: HttpRequest):
    cart, new_session_id = get_or_create_cart(request)
    serializer = CartSerializer(cart)
    response =  Response(serializer.data)
    if new_session_id:
        set_cart_session_cookie(response, new_session_id)
    return response

@api_view(['POST'])
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

    cart, new_session_id = get_or_create_cart(request)
    cart_item = CartItem.objects.filter(cart=cart, product=product).first()
    if not cart_item:
        return Response({'error': 'Cart item not found'}, status=404)

    cart_item.quantity = int(quantity)
    cart_item.save()

    serializer = CartSerializer(cart)
    response = Response(serializer.data)
    if new_session_id:
        set_cart_session_cookie(response, new_session_id)
    return response

@api_view(['POST'])
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

    cart, new_session_id = get_or_create_cart(request)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    cart_item.quantity += int(quantity)
    if cart_item.quantity <= 0:
        cart_item.delete()
    else:
        cart_item.save()

    serializer = CartSerializer(cart)
    response = Response(serializer.data)
    if new_session_id:
        set_cart_session_cookie(response, new_session_id)
    return response

@api_view(['POST'])
def remove_from_cart(request: HttpRequest):
    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart, new_session_id = get_or_create_cart(request)
    CartItem.objects.filter(cart=cart, product=product).delete()
    serializer = CartSerializer(cart)
    response = Response(serializer.data)
    if new_session_id:
        set_cart_session_cookie(response, new_session_id)
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_cart(request):
    session_id = request.COOKIES.get('cart_session_id')
    if not session_id:
        return Response({'message': 'No session cart to merge'}, status=200)

    try:
        session_cart = Cart.objects.get(session_key=session_id, user=None)
    except Cart.DoesNotExist:
        return Response({'message': 'Session cart already merged or expired'}, status=200)

    user_cart, __ = Cart.objects.get_or_create(user=request.user, session_key=None)

    for session_item in session_cart.items.all():
        user_item, created = CartItem.objects.get_or_create(
            cart=user_cart,
            product=session_item.product,
            defaults={'quantity': session_item.quantity}
        )
        if not created:
            user_item.quantity += session_item.quantity
            user_item.save()

    session_cart.delete()
    response = Response({'message': 'Cart merged successfully'}, status=200)
    response.delete_cookie('cart_session_id')
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_local_cart(request):
    items = request.data.get('items', [])  # list of {product_id, quantity}
    user_cart, _ = Cart.objects.get_or_create(user=request.user, session_key=None)

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

    return Response({'message': 'Local cart synced'})
