from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RoomType, Room, RoomBooking, RoomService, RoomMaintenance
from reservations.serializers import CustomerSerializer

User = get_user_model()


class RoomTypeSerializer(serializers.ModelSerializer):
    room_count = serializers.IntegerField(source='rooms.count', read_only=True)
    available_rooms = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomType
        fields = [
            'id', 'name', 'description', 'base_price', 'max_occupancy',
            'size_sqm', 'has_wifi', 'has_ac', 'has_tv', 'has_minibar',
            'has_balcony', 'has_kitchen', 'has_bathtub', 'is_active',
            'room_count', 'available_rooms', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_available_rooms(self, obj):
        return obj.rooms.filter(status='available', is_active=True).count()


class RoomSerializer(serializers.ModelSerializer):
    room_type = RoomTypeSerializer(read_only=True)
    room_type_id = serializers.IntegerField(write_only=True)
    is_available = serializers.ReadOnlyField()
    current_booking = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'number', 'room_type', 'room_type_id', 'floor', 'status',
            'view_type', 'notes', 'last_cleaned', 'last_maintenance',
            'is_active', 'is_available', 'current_booking',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_current_booking(self, obj):
        current = obj.current_booking
        if current:
            return {
                'id': current.id,
                'booking_number': current.booking_number,
                'customer_name': current.customer.full_name,
                'check_in_date': current.check_in_date,
                'check_out_date': current.check_out_date
            }
        return None


class RoomServiceSerializer(serializers.ModelSerializer):
    booking = serializers.StringRelatedField(read_only=True)
    requested_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    room_number = serializers.CharField(source='booking.room.number', read_only=True)
    
    class Meta:
        model = RoomService
        fields = [
            'id', 'booking', 'room_number', 'service_type', 'description',
            'priority', 'charge', 'status', 'requested_by', 'assigned_to',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['requested_by', 'created_at', 'completed_at']


class RoomMaintenanceSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.IntegerField(write_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = RoomMaintenance
        fields = [
            'id', 'room', 'room_id', 'maintenance_type', 'title', 'description',
            'scheduled_date', 'estimated_duration', 'status', 'priority',
            'estimated_cost', 'actual_cost', 'assigned_to', 'created_by',
            'created_at', 'started_at', 'completed_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'started_at', 'completed_at']


class RoomBookingSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.IntegerField(write_only=True)
    room = RoomSerializer(read_only=True)
    room_id = serializers.IntegerField(write_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    checked_in_by = serializers.StringRelatedField(read_only=True)
    checked_out_by = serializers.StringRelatedField(read_only=True)
    services = RoomServiceSerializer(many=True, read_only=True)
    is_current = serializers.ReadOnlyField()
    
    class Meta:
        model = RoomBooking
        fields = [
            'id', 'booking_number', 'customer', 'customer_id', 'room', 'room_id',
            'check_in_date', 'check_out_date', 'nights', 'adults', 'children',
            'room_rate', 'total_room_charges', 'tax_amount', 'additional_charges',
            'discount_amount', 'total_amount', 'status', 'source',
            'special_requests', 'arrival_time', 'created_by', 'checked_in_by',
            'checked_out_by', 'services', 'is_current', 'created_at',
            'updated_at', 'checked_in_at', 'checked_out_at'
        ]
        read_only_fields = [
            'booking_number', 'nights', 'total_room_charges', 'total_amount',
            'created_by', 'checked_in_by', 'checked_out_by', 'created_at',
            'updated_at', 'checked_in_at', 'checked_out_at'
        ]
    
    def create(self, validated_data):
        booking = RoomBooking.objects.create(**validated_data)
        
        # Mark room as occupied if booking is confirmed
        if booking.status == 'confirmed':
            booking.room.status = 'occupied'
            booking.room.save()
        
        return booking


class RoomBookingSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for booking lists"""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    
    class Meta:
        model = RoomBooking
        fields = [
            'id', 'booking_number', 'customer_name', 'room_number',
            'check_in_date', 'check_out_date', 'nights', 'status',
            'total_amount', 'created_at'
        ]