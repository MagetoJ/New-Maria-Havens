from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
# from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import date, datetime, timedelta

from .models import Customer, Reservation, ReservationNote, ReservationHistory, WaitList
from .serializers import (
    CustomerSerializer, ReservationSerializer, ReservationSummarySerializer,
    ReservationNoteSerializer, WaitListSerializer
)
from accounts.permissions import RoleBasedPermission
from orders.models import Table


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['is_vip', 'is_blacklisted']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['first_name', 'last_name', 'total_visits', 'total_spent', 'last_visit']
    ordering = ['last_name', 'first_name']
    
    @action(detail=False, methods=['get'])
    def vip(self, request):
        """Get VIP customers"""
        customers = self.queryset.filter(is_vip=True)
        serializer = self.get_serializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def make_vip(self, request, pk=None):
        """Make customer VIP"""
        customer = self.get_object()
        customer.is_vip = True
        customer.save()
        return Response({'status': 'customer is now VIP'})
    
    @action(detail=True, methods=['post'])
    def remove_vip(self, request, pk=None):
        """Remove VIP status"""
        customer = self.get_object()
        customer.is_vip = False
        customer.save()
        return Response({'status': 'VIP status removed'})


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('customer', 'table', 'created_by', 'host').prefetch_related('notes', 'history')
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'date', 'occasion', 'table']
    search_fields = ['reservation_number', 'customer__first_name', 'customer__last_name', 'customer__phone']
    ordering_fields = ['date', 'time', 'created_at', 'party_size']
    ordering = ['date', 'time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReservationSummarySerializer
        return ReservationSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm reservation"""
        reservation = self.get_object()
        if reservation.status == 'pending':
            reservation.status = 'confirmed'
            reservation.confirmation_sent = True
            reservation.save()
            
            # Create history entry
            ReservationHistory.objects.create(
                reservation=reservation,
                action='confirmed',
                performed_by=request.user
            )
            
            return Response({'status': 'reservation confirmed'})
        return Response({'error': 'Reservation cannot be confirmed'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel reservation"""
        reservation = self.get_object()
        if reservation.status not in ['completed', 'seated']:
            old_status = reservation.status
            reservation.status = 'cancelled'
            reservation.save()
            
            # Create history entry
            ReservationHistory.objects.create(
                reservation=reservation,
                action='cancelled',
                description=f'Cancelled from {old_status} status',
                performed_by=request.user
            )
            
            return Response({'status': 'reservation cancelled'})
        return Response({'error': 'Reservation cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def seat(self, request, pk=None):
        """Mark reservation as seated"""
        reservation = self.get_object()
        table_id = request.data.get('table_id')
        
        if reservation.status == 'confirmed':
            if table_id:
                table = get_object_or_404(Table, id=table_id)
                if table.is_occupied:
                    return Response({'error': 'Table is already occupied'}, status=status.HTTP_400_BAD_REQUEST)
                reservation.table = table
                table.is_occupied = True
                table.save()
            
            reservation.status = 'seated'
            reservation.seated_at = timezone.now()
            reservation.host = request.user
            reservation.save()
            
            # Update customer stats
            customer = reservation.customer
            customer.total_visits += 1
            customer.last_visit = timezone.now()
            customer.save()
            
            # Create history entry
            ReservationHistory.objects.create(
                reservation=reservation,
                action='seated',
                description=f'Seated at table {reservation.table.number if reservation.table else "TBD"}',
                performed_by=request.user
            )
            
            return Response({'status': 'reservation seated'})
        return Response({'error': 'Reservation cannot be seated'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete reservation"""
        reservation = self.get_object()
        if reservation.status == 'seated':
            reservation.status = 'completed'
            reservation.completed_at = timezone.now()
            reservation.save()
            
            # Free table
            if reservation.table:
                reservation.table.is_occupied = False
                reservation.table.save()
            
            # Create history entry
            ReservationHistory.objects.create(
                reservation=reservation,
                action='completed',
                performed_by=request.user
            )
            
            return Response({'status': 'reservation completed'})
        return Response({'error': 'Reservation cannot be completed'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """Mark reservation as no show"""
        reservation = self.get_object()
        if reservation.status == 'confirmed':
            reservation.status = 'no_show'
            reservation.save()
            
            # Create history entry
            ReservationHistory.objects.create(
                reservation=reservation,
                action='no_show',
                performed_by=request.user
            )
            
            return Response({'status': 'marked as no show'})
        return Response({'error': 'Cannot mark as no show'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add note to reservation"""
        reservation = self.get_object()
        note_text = request.data.get('note')
        
        if note_text:
            note = ReservationNote.objects.create(
                reservation=reservation,
                note=note_text,
                created_by=request.user
            )
            serializer = ReservationNoteSerializer(note)
            return Response(serializer.data)
        return Response({'error': 'Note text required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's reservations"""
        today = timezone.now().date()
        reservations = self.queryset.filter(date=today)
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming reservations (next 7 days)"""
        today = timezone.now().date()
        week_from_now = today + timedelta(days=7)
        reservations = self.queryset.filter(
            date__gte=today,
            date__lte=week_from_now,
            status__in=['confirmed', 'pending']
        )
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def availability(self, request):
        """Check availability for a specific date and time"""
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        party_size = request.query_params.get('party_size', 2)
        
        if not date_str or not time_str:
            return Response({'error': 'Date and time required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            check_time = datetime.strptime(time_str, '%H:%M').time()
            party_size = int(party_size)
        except ValueError:
            return Response({'error': 'Invalid date/time format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check existing reservations
        existing_reservations = Reservation.objects.filter(
            date=check_date,
            status__in=['confirmed', 'seated'],
            time__range=(
                (datetime.combine(check_date, check_time) - timedelta(hours=2)).time(),
                (datetime.combine(check_date, check_time) + timedelta(hours=2)).time()
            )
        ).count()
        
        # Get available tables
        available_tables = Table.objects.filter(
            is_active=True,
            capacity__gte=party_size
        ).exclude(
            reservations__date=check_date,
            reservations__status__in=['confirmed', 'seated'],
            reservations__time__range=(
                (datetime.combine(check_date, check_time) - timedelta(hours=2)).time(),
                (datetime.combine(check_date, check_time) + timedelta(hours=2)).time()
            )
        )
        
        return Response({
            'available': available_tables.count() > 0,
            'available_tables': available_tables.count(),
            'existing_reservations': existing_reservations
        })


class WaitListViewSet(viewsets.ModelViewSet):
    queryset = WaitList.objects.select_related('customer', 'converted_to_reservation')
    serializer_class = WaitListSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'notified', 'date']
    search_fields = ['customer__first_name', 'customer__last_name', 'customer__phone']
    ordering = ['date', 'time', 'created_at']
    
    @action(detail=True, methods=['post'])
    def notify(self, request, pk=None):
        """Notify customer about availability"""
        waitlist_entry = self.get_object()
        waitlist_entry.notified = True
        waitlist_entry.notified_at = timezone.now()
        waitlist_entry.save()
        
        # Here you would integrate with email/SMS service
        return Response({'status': 'customer notified'})
    
    @action(detail=True, methods=['post'])
    def convert_to_reservation(self, request, pk=None):
        """Convert waitlist entry to reservation"""
        waitlist_entry = self.get_object()
        
        # Create reservation
        reservation_data = {
            'customer': waitlist_entry.customer,
            'date': waitlist_entry.date,
            'time': waitlist_entry.time,
            'party_size': waitlist_entry.party_size,
            'status': 'confirmed',
            'created_by': request.user
        }
        
        reservation = Reservation.objects.create(**reservation_data)
        
        # Update waitlist entry
        waitlist_entry.converted_to_reservation = reservation
        waitlist_entry.is_active = False
        waitlist_entry.save()
        
        return Response({
            'status': 'converted to reservation',
            'reservation_id': reservation.id
        })