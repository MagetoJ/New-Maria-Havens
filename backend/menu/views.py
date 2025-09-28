from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import filters
from django.db.models import Q, Avg, Count, F
from django.utils import timezone

from .models import (
    Category, MenuItem, MenuItemVariation, MenuItemAddOn,
    MenuItemAddOnRelation, Recipe, RecipeIngredient, MenuDiscount
)
from .serializers import (
    CategorySerializer, MenuItemSerializer, MenuItemListSerializer,
    MenuItemCreateSerializer, MenuItemVariationSerializer, MenuItemAddOnSerializer,
    RecipeSerializer, MenuDiscountSerializer, MenuStatsSerializer
)
from accounts.models import UserActivity


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []  # Temporarily allow public access for testing
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']
    ordering = ['sort_order', 'name']
    
    def perform_create(self, serializer):
        if not self.request.user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        category = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='menu_updated',
            description=f'Created category: {category.name}',
            ip_address=self.get_client_ip(),
            metadata={'category_id': category.id, 'action_type': 'create'}
        )
    
    def perform_update(self, serializer):
        if not self.request.user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        category = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='menu_updated',
            description=f'Updated category: {category.name}',
            ip_address=self.get_client_ip(),
            metadata={'category_id': category.id, 'action_type': 'update'}
        )
    
    def perform_destroy(self, instance):
        if not self.request.user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        category_name = instance.name
        super().perform_destroy(instance)
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='menu_updated',
            description=f'Deleted category: {category_name}',
            ip_address=self.get_client_ip(),
            metadata={'action_type': 'delete'}
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR', '127.0.0.1')


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'availability_status', 'is_featured', 'is_vegetarian', 'is_vegan']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at', 'sort_order']
    ordering = ['category', 'sort_order', 'name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MenuItemListSerializer
        elif self.action == 'create':
            return MenuItemCreateSerializer
        return MenuItemSerializer
    
    def get_queryset(self):
        queryset = MenuItem.objects.select_related('category', 'created_by', 'updated_by').all()
        
        # Filter for POS (only available items for non-admin users)
        user = getattr(self.request, 'user', None)
        if (not user or not user.is_authenticated or not user.can_manage_menu()) and self.request.query_params.get('pos') == 'true':
            queryset = queryset.filter(availability_status='available')
        
        return queryset
    
    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        menu_item = serializer.save()
        
        # Log activity if user is authenticated
        if user and user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                action='menu_updated',
                description=f'Created menu item: {menu_item.name}',
                ip_address=self.get_client_ip(),
                metadata={'menu_item_id': menu_item.id, 'action_type': 'create'}
            )
    
    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        menu_item = serializer.save()
        
        # Log activity if user is authenticated
        if user and user.is_authenticated:
            UserActivity.objects.create(
                user=user,
                action='menu_updated',
                description=f'Updated menu item: {menu_item.name}',
                ip_address=self.get_client_ip(),
                metadata={'menu_item_id': menu_item.id, 'action_type': 'update'}
            )
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        if not self.request.user.can_manage_menu():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        menu_item = self.get_object()
        stock_quantity = request.data.get('stock_quantity')
        
        if stock_quantity is not None:
            try:
                stock_quantity = int(stock_quantity)
                if stock_quantity < 0:
                    return Response({'error': 'Stock quantity cannot be negative.'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                
                old_quantity = menu_item.stock_quantity
                menu_item.stock_quantity = stock_quantity
                menu_item.save(update_fields=['stock_quantity'])
                
                # Log activity
                UserActivity.objects.create(
                    user=self.request.user,
                    action='menu_updated',
                    description=f'Updated stock for {menu_item.name}: {old_quantity} → {stock_quantity}',
                    ip_address=self.get_client_ip(),
                    metadata={'menu_item_id': menu_item.id, 'action_type': 'stock_update',
                             'old_quantity': old_quantity, 'new_quantity': stock_quantity}
                )
                
                return Response({'message': 'Stock updated successfully', 'stock_quantity': stock_quantity})
            except ValueError:
                return Response({'error': 'Invalid stock quantity.'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'error': 'Stock quantity is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        if not self.request.user.can_manage_menu():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        low_stock_items = MenuItem.objects.filter(
            stock_quantity__lte=F('low_stock_threshold')
        ).select_related('category')
        
        serializer = MenuItemListSerializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_items = MenuItem.objects.filter(
            is_featured=True, 
            availability_status='available'
        ).select_related('category')
        
        serializer = MenuItemListSerializer(featured_items, many=True)
        return Response(serializer.data)
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR', '127.0.0.1')


class MenuItemAddOnViewSet(viewsets.ModelViewSet):
    queryset = MenuItemAddOn.objects.all()
    serializer_class = MenuItemAddOnSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    filterset_fields = ['is_available']
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        if not self.request.user.can_manage_menu():
            self.permission_denied(self.request, message='Permission denied.')
        
        addon = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='menu_updated',
            description=f'Created addon: {addon.name}',
            ip_address=self.get_client_ip(),
            metadata={'addon_id': addon.id, 'action_type': 'create'}
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR', '127.0.0.1')


class MenuDiscountViewSet(viewsets.ModelViewSet):
    queryset = MenuDiscount.objects.all()
    serializer_class = MenuDiscountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    filterset_fields = ['is_active', 'discount_type']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = MenuDiscount.objects.all()
        
        # Filter active discounts for current time
        if self.request.query_params.get('active_only') == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            )
        
        return queryset
    
    def perform_create(self, serializer):
        if not self.request.user.can_access_admin():
            self.permission_denied(self.request, message='Permission denied.')
        
        discount = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            action='menu_updated',
            description=f'Created discount: {discount.name}',
            ip_address=self.get_client_ip(),
            metadata={'discount_id': discount.id, 'action_type': 'create'}
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR', '127.0.0.1')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_stats(request):
    """Get menu statistics"""
    if not request.user.can_manage_menu():
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    total_items = MenuItem.objects.count()
    available_items = MenuItem.objects.filter(availability_status='available').count()
    unavailable_items = MenuItem.objects.filter(availability_status='unavailable').count()
    low_stock_items = MenuItem.objects.filter(
        stock_quantity__lte=F('low_stock_threshold')
    ).count()
    featured_items = MenuItem.objects.filter(is_featured=True).count()
    categories_count = Category.objects.filter(is_active=True).count()
    
    average_price = MenuItem.objects.filter(
        availability_status='available'
    ).aggregate(avg_price=Avg('price'))['avg_price'] or 0
    
    total_discounts = MenuDiscount.objects.filter(is_active=True).count()
    
    stats = {
        'total_items': total_items,
        'available_items': available_items,
        'unavailable_items': unavailable_items,
        'low_stock_items': low_stock_items,
        'featured_items': featured_items,
        'categories_count': categories_count,
        'average_price': round(average_price, 2),
        'total_discounts': total_discounts
    }
    
    serializer = MenuStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_update_stock(request):
    """Bulk update stock quantities"""
    if not request.user.can_manage_menu():
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    items = request.data.get('items', [])
    updated_items = []
    
    for item_data in items:
        item_id = item_data.get('id')
        stock_quantity = item_data.get('stock_quantity')
        
        if item_id and stock_quantity is not None:
            try:
                menu_item = MenuItem.objects.get(id=item_id)
                old_quantity = menu_item.stock_quantity
                menu_item.stock_quantity = int(stock_quantity)
                menu_item.save(update_fields=['stock_quantity'])
                
                updated_items.append({
                    'id': item_id,
                    'name': menu_item.name,
                    'old_quantity': old_quantity,
                    'new_quantity': menu_item.stock_quantity
                })
            except (MenuItem.DoesNotExist, ValueError):
                continue
    
    # Log activity
    UserActivity.objects.create(
        user=request.user,
        action='menu_updated',
        description=f'Bulk updated stock for {len(updated_items)} items',
        ip_address=get_client_ip(request),
        metadata={'action_type': 'bulk_stock_update', 'updated_items': updated_items}
    )
    
    return Response({
        'message': f'Successfully updated {len(updated_items)} items',
        'updated_items': updated_items
    })


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')