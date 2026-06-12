from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Product, Category, Cart, CartItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer

@api_view(['GET'])
def get_products(request):
    products = Product.objects.select_related('category').all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.select_related('category').get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)
    
    serializer = ProductSerializer(product)
    return Response(serializer.data)

@api_view(['GET'])
def get_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    
    serializer = CategorySerializer(category)
    return Response(serializer.data)

@api_view(['GET'])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
def update_cart(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity')

    if (quantity is None) or (not str(quantity).isdigit()) or (int(quantity) < 1):
        return Response({'error': 'Invalid quantity'}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart = Cart.objects.filter(user=request.user).first()
    if not cart:
        return Response({'error': 'Cart not found'}, status=404)

    cart_item = CartItem.objects.filter(cart=cart, product=product).first()
    if not cart_item:
        return Response({'error': 'Cart item not found'}, status=404)

    cart_item.quantity = int(quantity)
    cart_item.save()

    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    cart_item.quantity += int(quantity)
    cart_item.save()

    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
def remove_from_cart(request):
    product_id = request.data.get('product_id')

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart = Cart.objects.filter(user=request.user).first()
    if not cart:
        return Response({'error': 'Cart not found'}, status=404)

    cart_item = CartItem.objects.filter(cart=cart, product=product).first()
    if not cart_item:
        return Response({'error': 'Cart item not found'}, status=404)

    cart_item.delete()

    serializer = CartSerializer(cart)
    return Response(serializer.data)
