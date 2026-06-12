from django.http import JsonResponse

def home(request):
    data = {
        'message': 'Welcome to the E-commerce API',
    }
    return JsonResponse(data)
