from django.contrib.auth import authenticate, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
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

    # A shop subdomain (request.shop, set by ShopContextMiddleware) is a
    # manager-only surface — only that shop's owner (or a superuser) may sign in.
    shop = getattr(request, 'shop', None)
    if shop is not None and not (user.is_superuser or shop.owner_id == user.id):
        return Response(
            {"error": "Only this shop's manager can sign in here."},
            status=status.HTTP_403_FORBIDDEN,
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_email(request: HttpRequest):
    email = (request.data.get('email') or '').strip()
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_email(email)
    except ValidationError:
        return Response({"error": "Enter a valid email address"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return Response({"error": "That email is already in use"}, status=status.HTTP_400_BAD_REQUEST)

    user.email = email
    user.save(update_fields=['email'])
    return Response(UserSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request: HttpRequest):
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    if not current_password or not new_password:
        return Response(
            {"error": "Both current_password and new_password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    if not user.has_usable_password():
        return Response(
            {"error": "Your account has no password set (you signed in via a social login)"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not user.check_password(current_password):
        return Response({"error": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password, user)
    except ValidationError as exc:
        return Response({"error": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password updated successfully"})
