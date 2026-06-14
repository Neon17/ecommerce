from django.contrib.auth import authenticate, logout
from django.http import HttpRequest
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from ..serializers import RegisterSerializer, UserSerializer


def tokens_for_user(user):
    """Return access/refresh pair using the keys the frontend expects."""
    refresh = RefreshToken.for_user(user)
    return {"token": str(refresh.access_token), "refresh": str(refresh)}


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {**tokens_for_user(user), "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response({**tokens_for_user(user), "user": UserSerializer(user).data})


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    refresh = request.data.get('refresh')
    if not refresh:
        return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh)
    except TokenError:
        return Response(
            {"error": "Invalid or expired refresh token"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response({"token": str(token.access_token)})


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request: HttpRequest):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
