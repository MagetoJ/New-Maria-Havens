from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
# from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Table, Order, OrderItem, Payment, KitchenDisplay
from .serializers import (
    TableSerializer, OrderSerializer, OrderSummarySerializer,
    OrderItemSerializer, PaymentSerializer, KitchenDisplaySerializer
)
from accounts.permissions import RoleBasedPermission


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_occupied', 'section']
    search_fields = ['number', 'section']
    ordering_fields = ['number', 'capacity']
    ordering = ['number']
    
    @action(detail=True, methods=['post'])
    def occupy(self, request, pk=None):
        """Mark table as occupied"""
        table = self.get_object()
        table.is_occupied = True
        table.save()
        return Response({'status': 'table occupied'})
    
    @action(detail=True, methods=['post'])
    def free(self, request, pk=None):
        """Mark table as free"""
        table = self.get_object()
        table.is_occupied = False
        table.save()
        return Response({'status': 'table freed'})
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available tables"""
        tables = self.queryset.filter(is_active=True, is_occupied=False)
        serializer = self.get_serializer(tables, many=True)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('table', 'server', 'kitchen_staff').prefetch_related('items__menu_item', 'payments')
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'order_type', 'table']
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrderSummarySerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        """Create order and assign server"""
        user = getattr(self.request, 'user', None)
        # Only assign user if they are authenticated
        server = user if user and user.is_authenticated else None
        order = serializer.save(server=server)
        
        # Mark table as occupied if dine-in
        if order.table and order.order_type == 'dine_in':
            order.table.is_occupied = True
            order.table.save()
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm order and send to kitchen"""
        order = self.get_object()
        if order.status == 'pending':
            order.status = 'confirmed'
            order.confirmed_at = timezone.now()
            order.save()
            
            # Create kitchen display items
            for item in order.items.all():
                KitchenDisplay.objects.create(
                    order_item=item,
                    estimated_completion=timezone.now() + timezone.timedelta(minutes=item.menu_item.preparation_time)
                )
            
            return Response({'status': 'order confirmed'})
        return Response({'error': 'Order cannot be confirmed'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order"""
        order = self.get_object()
        if order.status not in ['served', 'completed']:
            order.status = 'cancelled'
            order.save()
            
            # Free table if applicable
            if order.table and order.order_type == 'dine_in':
                order.table.is_occupied = False
                order.table.save()
            
            return Response({'status': 'order cancelled'})
        return Response({'error': 'Order cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def serve(self, request, pk=None):
        """Mark order as served"""
        order = self.get_object()
        if order.status in ['ready', 'preparing']:
            order.status = 'served'
            order.served_at = timezone.now()
            order.save()
            return Response({'status': 'order served'})
        return Response({'error': 'Order cannot be served'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete order and free table"""
        order = self.get_object()
        if order.status == 'served':
            order.status = 'completed'
            order.completed_at = timezone.now()
            order.save()
            
            # Free table if applicable
            if order.table and order.order_type == 'dine_in':
                order.table.is_occupied = False
                order.table.save()
            
            return Response({'status': 'order completed'})
        return Response({'error': 'Order cannot be completed'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active orders"""
        orders = self.queryset.exclude(status__in=['completed', 'cancelled'])
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def kitchen_queue(self, request):
        """Get orders for kitchen display"""
        orders = self.queryset.filter(
            status__in=['confirmed', 'preparing']
        ).order_by('confirmed_at')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add payment to order"""
        order = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        
        if serializer.is_valid():
            user = getattr(request, 'user', None)
            processed_by = user if user and user.is_authenticated else None
            payment = serializer.save(
                order=order,
                processed_by=processed_by,
                processed_at=timezone.now()
            )
            return Response(PaymentSerializer(payment).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KitchenDisplayViewSet(viewsets.ModelViewSet):
    queryset = KitchenDisplay.objects.select_related(
        'order_item__order__table', 'order_item__menu_item', 'assigned_to'
    )
    serializer_class = KitchenDisplaySerializer
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [OrderingFilter]
    filterset_fields = ['station', 'priority']
    ordering_fields = ['priority', 'estimated_completion', 'created_at']
    ordering = ['priority', 'estimated_completion']
    
    def get_queryset(self):
        """Filter out completed items"""
        return self.queryset.filter(completed_at__isnull=True)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start preparing item"""
        display = self.get_object()
        display.started_at = timezone.now()
        user = getattr(request, 'user', None)
        display.assigned_to = user if user and user.is_authenticated else None
        display.order_item.status = 'preparing'
        display.save()
        display.order_item.save()
        
        # Update order status if all items are preparing
        order = display.order_item.order
        if not order.items.exclude(status__in=['preparing', 'ready', 'served']).exists():
            order.status = 'preparing'
            order.save()
        
        return Response({'status': 'item started'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete item preparation"""
        display = self.get_object()
        display.completed_at = timezone.now()
        display.order_item.status = 'ready'
        display.save()
        display.order_item.save()
        
        # Update order status if all items are ready
        order = display.order_item.order
        if not order.items.exclude(status__in=['ready', 'served']).exists():
            order.status = 'ready'
            order.save()
        
        return Response({'status': 'item completed'})
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue items"""
        displays = self.get_queryset().filter(
            estimated_completion__lt=timezone.now(),
            completed_at__isnull=True
        )
        serializer = self.get_serializer(displays, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('order', 'processed_by')
    serializer_class = PaymentSerializer
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [OrderingFilter]
    filterset_fields = ['payment_method', 'status']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(
            processed_by=getattr(self.request, 'user', None),
            processed_at=timezone.now()
        )


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related('order', 'menu_item')
    serializer_class = OrderItemSerializer
    permission_classes = [AllowAny]  # Temporarily allow unauthenticated access for development
    filter_backends = [OrderingFilter]
    filterset_fields = ['order', 'menu_item', 'status']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Create order item and update order total"""
        order_item = serializer.save()
        
        # Recalculate order total
        order = order_item.order
        order.calculate_total()
        order.save()
    
    def perform_update(self, serializer):
        """Update order item and recalculate order total"""
        order_item = serializer.save()
        
        # Recalculate order total
        order = order_item.order
        order.calculate_total()
        order.save()
    
    def perform_destroy(self, instance):
        """Delete order item and recalculate order total"""
        order = instance.order
        instance.delete()
        
        # Recalculate order total
        order.calculate_total()
        order.save()