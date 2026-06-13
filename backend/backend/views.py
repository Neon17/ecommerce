from django.http import JsonResponse
from django.shortcuts import render


def _wants_json(request):
    """API clients get JSON; browsers get the styled HTML page."""
    if request.path.startswith('/api/'):
        return True
    return 'application/json' in request.headers.get('Accept', '')


def custom_404(request, exception=None):
    if _wants_json(request):
        return JsonResponse({
            'error': 'Not Found',
            'status': 404,
            'detail': 'The requested resource was not found.',
            'path': request.path,
        }, status=404)
    return render(request, '404.html', status=404)


def custom_500(request):
    if _wants_json(request):
        return JsonResponse({
            'error': 'Internal Server Error',
            'status': 500,
            'detail': 'Something went wrong on our end. Please try again later.',
        }, status=500)
    return render(request, '500.html', status=500)
