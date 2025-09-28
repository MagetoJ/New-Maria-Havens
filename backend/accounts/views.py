from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout, authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import uuid
from datetime import timedelta

from .models import User, UserActivity, UserSession
from .serializers import (
    UserSerializer, UserCreateSerializer,
    UserUpdateSerializer, ChangePasswordSerializer, UserActivitySerializer,
    LoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            
            # Create user session
            session_key = str(uuid.uuid4())
            UserSession.objects.create(
                user=user,
                session_key=session_key,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                action='login',
                description=f'User logged in from {get_client_ip(request)}',
                ip_address=get_client_ip(request),
                metadata={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
            )
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'session_key': session_key
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Deactivate user sessions
        UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            action='logout',
            description='User logged out',
            ip_address=get_client_ip(request),
        )
        
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        # Only admins and managers can view all users
        if self.request.user.can_access_admin():
            return User.objects.all().order_by('-date_joined')
        return User.objects.filter(id=self.request.user.id)
    
    def perform_create(self, serializer):
        # Only admins and managers can create users
        if not self.request.user.can_access_admin():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='user_created',
            description=f'Created user: {user.get_full_name()}',
            ip_address=get_client_ip(self.request),
            metadata={'created_user_id': user.id}
        )


class UserRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        # Users can only view/edit their own profile unless they're admin/manager
        obj = super().get_object()
        if obj != self.request.user and not self.request.user.can_access_admin():
            self.permission_denied(self.request, message='Permission denied.')
        return obj


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Deactivate all user sessions
            UserSession.objects.filter(user=user).update(is_active=False)
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                action='password_changed',
                description='User changed password',
                ip_address=get_client_ip(request),
            )
            
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserActivityListView(generics.ListAPIView):
    serializer_class = UserActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Admin/managers can see all activities, others only their own
        if self.request.user.can_access_admin():
            return UserActivity.objects.all().order_by('-timestamp')[:100]
        return UserActivity.objects.filter(user=self.request.user).order_by('-timestamp')[:50]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token (in production, use proper token generation)
            reset_token = str(uuid.uuid4())
            user.password_reset_token = reset_token
            user.password_reset_expires = timezone.now() + timedelta(hours=1)
            user.save()
            
            # Send email (implement actual email sending)
            reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                action='password_reset_requested',
                description='Password reset requested',
                ip_address=get_client_ip(request),
            )
            
            return Response({'message': 'Password reset email sent.'})
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
    
    return Response({'message': 'If email exists, reset instructions will be sent.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get basic stats for dashboard"""
    if not request.user.can_access_admin():
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(status='active').count(),
        'recent_activities': UserActivitySerializer(
            UserActivity.objects.all()[:10], many=True
        ).data,
        'active_sessions': UserSession.objects.filter(is_active=True).count(),
    }
    
    return Response(stats)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')