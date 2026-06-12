from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

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
