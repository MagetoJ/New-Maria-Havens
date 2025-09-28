from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Customer, Reservation, ReservationNote, ReservationHistory, WaitList

User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'dietary_restrictions', 'preferred_seating',
            'special_occasions', 'total_visits', 'total_spent', 'last_visit',
            'is_vip', 'is_blacklisted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_visits', 'total_spent', 'last_visit', 'created_at', 'updated_at']


class ReservationNoteSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ReservationNote
        fields = ['id', 'note', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class ReservationHistorySerializer(serializers.ModelSerializer):
    performed_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ReservationHistory
        fields = ['id', 'action', 'description', 'performed_by', 'timestamp']
        read_only_fields = ['performed_by', 'timestamp']


class ReservationSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.IntegerField(write_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    host = serializers.StringRelatedField(read_only=True)
    notes = ReservationNoteSerializer(many=True, read_only=True)
    history = ReservationHistorySerializer(many=True, read_only=True)
    datetime = serializers.ReadOnlyField()
    is_past_due = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    estimated_end_time = serializers.ReadOnlyField()
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'customer', 'customer_id', 'date', 'time',
            'party_size', 'duration_hours', 'table', 'table_number', 'seating_preference',
            'special_requests', 'occasion', 'status', 'confirmation_sent',
            'reminder_sent', 'created_by', 'host', 'notes', 'history',
            'datetime', 'is_past_due', 'is_today', 'estimated_end_time',
            'created_at', 'updated_at', 'seated_at', 'completed_at'
        ]
        read_only_fields = [
            'reservation_number', 'created_by', 'host', 'created_at',
            'updated_at', 'seated_at', 'completed_at'
        ]
    
    def create(self, validated_data):
        reservation = Reservation.objects.create(**validated_data)
        
        # Create history entry
        ReservationHistory.objects.create(
            reservation=reservation,
            action='created',
            description=f'Reservation created for {reservation.party_size} people',
            performed_by=self.context['request'].user
        )
        
        return reservation


class WaitListSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.IntegerField(write_only=True)
    converted_reservation = serializers.StringRelatedField(source='converted_to_reservation', read_only=True)
    
    class Meta:
        model = WaitList
        fields = [
            'id', 'customer', 'customer_id', 'date', 'time', 'party_size',
            'notify_by_phone', 'notify_by_email', 'is_active', 'notified',
            'converted_reservation', 'created_at', 'notified_at'
        ]
        read_only_fields = ['notified', 'created_at', 'notified_at']


class ReservationSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for reservation lists"""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'customer_name', 'date', 'time',
            'party_size', 'table_number', 'status', 'occasion', 'created_at'
        ]