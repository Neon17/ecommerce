from django.http import HttpRequest
from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models import Product, Category
from ..serializers import ProductSerializer, CategorySerializer


@api_view(['GET'])
def get_products(request: HttpRequest):
    products = Product.objects.select_related('category').all()
    # On a shop subdomain, ShopContextMiddleware sets request.shop — scope the
    # storefront to that shop. On the main domain it stays the full catalog.
    shop = getattr(request, 'shop', None)
    if shop:
        products = products.filter(shop=shop)
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
