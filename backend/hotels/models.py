from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from reservations.models import Customer

User = get_user_model()


class RoomType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    max_occupancy = models.IntegerField()
    size_sqm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Amenities
    has_wifi = models.BooleanField(default=True)
    has_ac = models.BooleanField(default=True)
    has_tv = models.BooleanField(default=True)
    has_minibar = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_kitchen = models.BooleanField(default=False)
    has_bathtub = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Room(models.Model):
    ROOM_STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
        ('cleaning', 'Being Cleaned'),
        ('out_of_order', 'Out of Order'),
    ]
    
    number = models.CharField(max_length=10, unique=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')
    floor = models.IntegerField()
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='available')
    
    # Physical details
    view_type = models.CharField(max_length=100, blank=True, help_text="e.g., Ocean View, Garden View")
    notes = models.TextField(blank=True)
    
    # Maintenance
    last_cleaned = models.DateTimeField(null=True, blank=True)
    last_maintenance = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['number']
    
    def __str__(self):
        return f"Room {self.number} ({self.room_type.name})"
    
    @property
    def is_available(self):
        return self.status == 'available' and self.is_active
    
    @property
    def current_booking(self):
        """Get current active booking for this room"""
        return self.bookings.filter(
            status__in=['confirmed', 'checked_in'],
            check_in_date__lte=timezone.now().date(),
            check_out_date__gte=timezone.now().date()
        ).first()


class RoomBooking(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    BOOKING_SOURCE_CHOICES = [
        ('walk_in', 'Walk In'),
        ('phone', 'Phone'),
        ('website', 'Website'),
        ('email', 'Email'),
        ('third_party', 'Third Party'),
    ]
    
    # Basic Information
    booking_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='hotel_bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    
    # Dates
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    nights = models.IntegerField()
    
    # Guest Details
    adults = models.IntegerField(validators=[MinValueValidator(1)])
    children = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Pricing
    room_rate = models.DecimalField(max_digits=10, decimal_places=2)
    total_room_charges = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    additional_charges = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status and Source
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    source = models.CharField(max_length=20, choices=BOOKING_SOURCE_CHOICES, default='walk_in')
    
    # Special Requests
    special_requests = models.TextField(blank=True)
    arrival_time = models.TimeField(null=True, blank=True)
    
    # Staff
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_bookings')
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_in_bookings')
    checked_out_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_out_bookings')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.booking_number} - {self.customer.full_name}"
    
    def save(self, *args, **kwargs):
        if not self.booking_number:
            # Generate booking number: HTL-YYYYMMDD-XXXXX
            from django.utils.text import get_random_string
            date_part = timezone.now().strftime('%Y%m%d')
            random_part = get_random_string(5, '0123456789')
            self.booking_number = f'HTL-{date_part}-{random_part}'
        
        # Calculate nights
        if self.check_in_date and self.check_out_date:
            self.nights = (self.check_out_date - self.check_in_date).days
        
        # Calculate totals
        if self.room_rate and self.nights:
            self.total_room_charges = self.room_rate * self.nights
            self.total_amount = self.total_room_charges + self.tax_amount + self.additional_charges - self.discount_amount
        
        super().save(*args, **kwargs)
    
    @property
    def is_current(self):
        """Check if booking is currently active"""
        today = timezone.now().date()
        return self.check_in_date <= today <= self.check_out_date and self.status == 'checked_in'


class RoomService(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('housekeeping', 'Housekeeping'),
        ('maintenance', 'Maintenance'),
        ('laundry', 'Laundry'),
        ('food_service', 'Food Service'),
        ('concierge', 'Concierge'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking = models.ForeignKey(RoomBooking, on_delete=models.CASCADE, related_name='services')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    description = models.TextField()
    priority = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Pricing
    charge = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    
    # Staff
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='requested_services')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_services')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-priority', 'created_at']
    
    def __str__(self):
        return f"{self.service_type} for {self.booking.room.number}"


class RoomMaintenance(models.Model):
    MAINTENANCE_TYPE_CHOICES = [
        ('preventive', 'Preventive Maintenance'),
        ('corrective', 'Corrective Maintenance'),
        ('emergency', 'Emergency Repair'),
        ('deep_cleaning', 'Deep Cleaning'),
        ('renovation', 'Renovation'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Scheduling
    scheduled_date = models.DateField()
    estimated_duration = models.IntegerField(help_text="Duration in hours")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    priority = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Staff
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='maintenance_assignments')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_maintenance')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-priority', 'scheduled_date']
    
    def __str__(self):
        return f"{self.maintenance_type} - Room {self.room.number}"