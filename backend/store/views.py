from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .cart_utils import get_or_create_cart, set_cart_session_cookie
from .models import Product, Category, Cart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, OrderSerializer
from .serializers import RegisterSerializer, UserSerializer
from rest_framework import status
from rest_framework.decorators import permission_classes
@api_view(['GET'])
def get_products(request: HttpRequest):
    products = Product.objects.select_related('category').all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_categories(request: HttpRequest):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product(request: HttpRequest, pk):
    try:
        product = Product.objects.select_related('category').get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)
    
    serializer = ProductSerializer(product)
    return Response(serializer.data)

@api_view(['GET'])
def get_category(request: HttpRequest, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    
    serializer = CategorySerializer(category)
    return Response(serializer.data)

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request: HttpRequest):
    orders = Order.objects.filter(user=request.user).all()
    orders_cleaned = OrderSerializer(orders, many=True)
    return Response(orders_cleaned.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk)
    order_cleaned = OrderSerializer(order)
    return Response(order_cleaned.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_order(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk)

    is_partial = (request.method == 'PATCH')
    serializer = OrderSerializer(order, data=request.data, partial=is_partial)
    serializer.is_valid(raise_exception=True)
    updated_order = serializer.save()

    return Response({
        'message': 'Order updated successfully',
        'order_id': updated_order.id,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request: HttpRequest):
    try:
        data = request.data
        name = data.get('name')
        address = data.get('address')
        phone = data.get('phone')
        payment_method = data.get('payment_method', 'COD')

        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart not found'}, status=404)

        total = sum(float(items.product.price) * items.quantity for items in cart.items.all())
        order = Order.objects.create(
            user=request.user,
            name=name,
            phone=phone,
            address=address,
            payment_method=payment_method,
            total_price = total,
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order = order,
                product = item.product,
                quantity = item.quantity,
                price = item.product.price,
            )

        cart.delete()

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id,
        })

    except Exception as e:
        return Response({'error': e}, status=400)

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


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User created successfully", "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



