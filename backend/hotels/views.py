from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
# from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import date, datetime, timedelta

from .models import RoomType, Room, RoomBooking, RoomService, RoomMaintenance
from .serializers import (
    RoomTypeSerializer, RoomSerializer, RoomBookingSerializer,
    RoomBookingSummarySerializer, RoomServiceSerializer, RoomMaintenanceSerializer
)
from accounts.permissions import RoleBasedPermission


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.annotate(room_count=Count('rooms'))
    serializer_class = RoomTypeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'base_price', 'max_occupancy']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available room types with available rooms"""
        room_types = self.queryset.filter(
            is_active=True,
            rooms__status='available',
            rooms__is_active=True
        ).distinct()
        serializer = self.get_serializer(room_types, many=True)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('room_type').prefetch_related('bookings')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'floor', 'room_type', 'is_active']
    search_fields = ['number', 'room_type__name', 'view_type']
    ordering_fields = ['number', 'floor', 'room_type__name']
    ordering = ['number']
    
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Change room status"""
        room = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Room.ROOM_STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        room.status = new_status
        room.save()
        
        return Response({'status': f'Room status changed to {new_status}'})
    
    @action(detail=True, methods=['post'])
    def mark_cleaned(self, request, pk=None):
        """Mark room as cleaned"""
        room = self.get_object()
        room.last_cleaned = timezone.now()
        if room.status == 'cleaning':
            room.status = 'available'
        room.save()
        
        return Response({'status': 'Room marked as cleaned'})
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available rooms"""
        rooms = self.queryset.filter(status='available', is_active=True)
        
        # Filter by date range if provided
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        if check_in and check_out:
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
                
                # Exclude rooms with conflicting bookings
                rooms = rooms.exclude(
                    bookings__status__in=['confirmed', 'checked_in'],
                    bookings__check_in_date__lt=check_out_date,
                    bookings__check_out_date__gt=check_in_date
                )
            except ValueError:
                pass
        
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def occupancy_report(self, request):
        """Get room occupancy statistics"""
        today = timezone.now().date()
        total_rooms = self.queryset.filter(is_active=True).count()
        occupied_rooms = self.queryset.filter(status='occupied').count()
        available_rooms = self.queryset.filter(status='available').count()
        maintenance_rooms = self.queryset.filter(status__in=['maintenance', 'cleaning', 'out_of_order']).count()
        
        occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
        
        return Response({
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'maintenance_rooms': maintenance_rooms,
            'occupancy_rate': round(occupancy_rate, 2)
        })


class RoomBookingViewSet(viewsets.ModelViewSet):
    queryset = RoomBooking.objects.select_related('customer', 'room', 'created_by').prefetch_related('services')
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source', 'room', 'check_in_date']
    search_fields = ['booking_number', 'customer__first_name', 'customer__last_name', 'customer__phone']
    ordering_fields = ['check_in_date', 'created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RoomBookingSummarySerializer
        return RoomBookingSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm booking"""
        booking = self.get_object()
        if booking.status == 'pending':
            booking.status = 'confirmed'
            booking.room.status = 'occupied'
            booking.save()
            booking.room.save()
            
            return Response({'status': 'booking confirmed'})
        return Response({'error': 'Booking cannot be confirmed'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel booking"""
        booking = self.get_object()
        if booking.status in ['pending', 'confirmed']:
            booking.status = 'cancelled'
            if booking.room.status == 'occupied':
                booking.room.status = 'available'
                booking.room.save()
            booking.save()
            
            return Response({'status': 'booking cancelled'})
        return Response({'error': 'Booking cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in guest"""
        booking = self.get_object()
        if booking.status == 'confirmed':
            booking.status = 'checked_in'
            booking.checked_in_at = timezone.now()
            booking.checked_in_by = request.user
            booking.room.status = 'occupied'
            booking.save()
            booking.room.save()
            
            # Update customer stats
            customer = booking.customer
            customer.total_visits += 1
            customer.last_visit = timezone.now()
            customer.save()
            
            return Response({'status': 'guest checked in'})
        return Response({'error': 'Cannot check in guest'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out guest"""
        booking = self.get_object()
        if booking.status == 'checked_in':
            booking.status = 'checked_out'
            booking.checked_out_at = timezone.now()
            booking.checked_out_by = request.user
            booking.room.status = 'cleaning'  # Room needs cleaning after checkout
            booking.save()
            booking.room.save()
            
            # Update customer spending
            customer = booking.customer
            customer.total_spent += booking.total_amount
            customer.save()
            
            return Response({'status': 'guest checked out'})
        return Response({'error': 'Cannot check out guest'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """Mark booking as no show"""
        booking = self.get_object()
        if booking.status == 'confirmed':
            booking.status = 'no_show'
            booking.room.status = 'available'
            booking.save()
            booking.room.save()
            
            return Response({'status': 'marked as no show'})
        return Response({'error': 'Cannot mark as no show'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def arrivals_today(self, request):
        """Get today's arrivals"""
        today = timezone.now().date()
        bookings = self.queryset.filter(
            check_in_date=today,
            status__in=['confirmed', 'checked_in']
        )
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def departures_today(self, request):
        """Get today's departures"""
        today = timezone.now().date()
        bookings = self.queryset.filter(
            check_out_date=today,
            status='checked_in'
        )
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_service(self, request, pk=None):
        """Add room service"""
        booking = self.get_object()
        service_data = request.data.copy()
        service_data['booking'] = booking.id
        
        serializer = RoomServiceSerializer(data=service_data)
        if serializer.is_valid():
            service = serializer.save(requested_by=request.user)
            return Response(RoomServiceSerializer(service).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomServiceViewSet(viewsets.ModelViewSet):
    queryset = RoomService.objects.select_related('booking__room', 'booking__customer', 'requested_by', 'assigned_to')
    serializer_class = RoomServiceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [OrderingFilter]
    filterset_fields = ['service_type', 'status', 'priority']
    ordering_fields = ['priority', 'created_at']
    ordering = ['-priority', 'created_at']
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign service to staff member"""
        service = self.get_object()
        staff_id = request.data.get('staff_id')
        
        if staff_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                staff = User.objects.get(id=staff_id)
                service.assigned_to = staff
                service.status = 'in_progress'
                service.save()
                return Response({'status': 'service assigned'})
            except User.DoesNotExist:
                return Response({'error': 'Staff member not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Staff ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark service as completed"""
        service = self.get_object()
        service.status = 'completed'
        service.completed_at = timezone.now()
        service.save()
        
        return Response({'status': 'service completed'})


class RoomMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = RoomMaintenance.objects.select_related('room', 'assigned_to', 'created_by')
    serializer_class = RoomMaintenanceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['maintenance_type', 'status', 'priority', 'room']
    search_fields = ['title', 'description', 'room__number']
    ordering_fields = ['priority', 'scheduled_date', 'created_at']
    ordering = ['-priority', 'scheduled_date']
    
    def perform_create(self, serializer):
        maintenance = serializer.save(created_by=self.request.user)
        
        # Set room status to maintenance if scheduled for today or past
        if maintenance.scheduled_date <= timezone.now().date():
            maintenance.room.status = 'maintenance'
            maintenance.room.save()
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start maintenance work"""
        maintenance = self.get_object()
        if maintenance.status == 'scheduled':
            maintenance.status = 'in_progress'
            maintenance.started_at = timezone.now()
            maintenance.room.status = 'maintenance'
            maintenance.save()
            maintenance.room.save()
            
            return Response({'status': 'maintenance started'})
        return Response({'error': 'Cannot start maintenance'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete maintenance work"""
        maintenance = self.get_object()
        if maintenance.status == 'in_progress':
            maintenance.status = 'completed'
            maintenance.completed_at = timezone.now()
            maintenance.actual_cost = request.data.get('actual_cost', maintenance.estimated_cost)
            maintenance.room.status = 'cleaning'  # Room needs cleaning after maintenance
            maintenance.room.last_maintenance = timezone.now()
            maintenance.save()
            maintenance.room.save()
            
            return Response({'status': 'maintenance completed'})
        return Response({'error': 'Cannot complete maintenance'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue maintenance"""
        today = timezone.now().date()
        overdue = self.queryset.filter(
            scheduled_date__lt=today,
            status__in=['scheduled', 'in_progress']
        )
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)