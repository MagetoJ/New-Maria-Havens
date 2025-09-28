from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from orders.models import Table

User = get_user_model()


class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Preferences
    dietary_restrictions = models.TextField(blank=True)
    preferred_seating = models.CharField(max_length=100, blank=True)
    special_occasions = models.TextField(blank=True)
    
    # Stats
    total_visits = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_visit = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_vip = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('pending', 'Pending'),
        ('seated', 'Seated'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    OCCASION_CHOICES = [
        ('birthday', 'Birthday'),
        ('anniversary', 'Anniversary'),
        ('date', 'Date Night'),
        ('business', 'Business Meeting'),
        ('celebration', 'Celebration'),
        ('casual', 'Casual Dining'),
        ('other', 'Other'),
    ]
    
    # Basic Information
    reservation_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reservations')
    
    # Reservation Details
    date = models.DateField()
    time = models.TimeField()
    party_size = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    duration_hours = models.DecimalField(max_digits=3, decimal_places=1, default=2.0)
    
    # Preferences
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    seating_preference = models.CharField(max_length=100, blank=True)
    special_requests = models.TextField(blank=True)
    occasion = models.CharField(max_length=20, choices=OCCASION_CHOICES, default='casual')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confirmation_sent = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    
    # Staff
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reservations')
    host = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='hosted_reservations')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    seated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    def __str__(self):
        return f"{self.reservation_number} - {self.customer.full_name} on {self.date} at {self.time}"
    
    def save(self, *args, **kwargs):
        if not self.reservation_number:
            # Generate reservation number: RES-YYYYMMDD-XXXXX
            from django.utils.text import get_random_string
            date_part = timezone.now().strftime('%Y%m%d')
            random_part = get_random_string(5, '0123456789')
            self.reservation_number = f'RES-{date_part}-{random_part}'
        
        super().save(*args, **kwargs)
    
    @property
    def datetime(self):
        """Combined datetime for the reservation"""
        from datetime import datetime, time as dt_time
        return datetime.combine(self.date, self.time)
    
    @property
    def is_past_due(self):
        """Check if reservation time has passed"""
        return timezone.now() > timezone.make_aware(self.datetime)
    
    @property
    def is_today(self):
        """Check if reservation is for today"""
        return self.date == timezone.now().date()
    
    @property
    def estimated_end_time(self):
        """Calculate estimated end time"""
        from datetime import timedelta
        duration = timedelta(hours=float(self.duration_hours))
        return self.datetime + duration


class ReservationNote(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='notes')
    note = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.reservation.reservation_number}"


class ReservationHistory(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('confirmed', 'Confirmed'),
        ('modified', 'Modified'),
        ('cancelled', 'Cancelled'),
        ('seated', 'Seated'),
        ('completed', 'Completed'),
        ('no_show', 'Marked as No Show'),
    ]
    
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Reservation History'
        verbose_name_plural = 'Reservation Histories'
    
    def __str__(self):
        return f"{self.reservation.reservation_number} - {self.action}"


class WaitList(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='waitlist_entries')
    date = models.DateField()
    time = models.TimeField()
    party_size = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Contact preferences
    notify_by_phone = models.BooleanField(default=True)
    notify_by_email = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    notified = models.BooleanField(default=False)
    converted_to_reservation = models.ForeignKey(
        Reservation, on_delete=models.SET_NULL, null=True, blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['date', 'time', 'created_at']
    
    def __str__(self):
        return f"Waitlist - {self.customer.full_name} for {self.date} at {self.time}"