from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Customer, Reservation, ReservationNote, ReservationHistory, WaitList


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'total_visits', 'total_spent', 'is_vip', 'last_visit']
    list_filter = ['is_vip', 'is_blacklisted', 'created_at', 'last_visit']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    readonly_fields = ['total_visits', 'total_spent', 'last_visit', 'created_at', 'updated_at']
    list_editable = ['is_vip']
    ordering = ['last_name', 'first_name']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'date_of_birth')
        }),
        ('Preferences', {
            'fields': ('dietary_restrictions', 'preferred_seating', 'special_occasions')
        }),
        ('Statistics', {
            'fields': ('total_visits', 'total_spent', 'last_visit'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_vip', 'is_blacklisted')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request)


class ReservationNoteInline(admin.TabularInline):
    model = ReservationNote
    extra = 0
    readonly_fields = ['created_by', 'created_at']


class ReservationHistoryInline(admin.TabularInline):
    model = ReservationHistory
    extra = 0
    readonly_fields = ['action', 'performed_by', 'timestamp']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = [
        'reservation_number', 'customer', 'date', 'time', 'party_size',
        'table', 'status', 'occasion', 'created_at'
    ]
    list_filter = ['status', 'occasion', 'date', 'created_at', 'table__section']
    search_fields = [
        'reservation_number', 'customer__first_name', 'customer__last_name',
        'customer__phone', 'customer__email'
    ]
    readonly_fields = [
        'reservation_number', 'created_by', 'host', 'created_at',
        'updated_at', 'seated_at', 'completed_at'
    ]
    inlines = [ReservationNoteInline, ReservationHistoryInline]
    ordering = ['-date', '-time']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Reservation Details', {
            'fields': ('reservation_number', 'customer', 'date', 'time', 'party_size', 'duration_hours')
        }),
        ('Table & Preferences', {
            'fields': ('table', 'seating_preference', 'special_requests', 'occasion')
        }),
        ('Status', {
            'fields': ('status', 'confirmation_sent', 'reminder_sent')
        }),
        ('Staff', {
            'fields': ('created_by', 'host')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'seated_at', 'completed_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'table', 'created_by', 'host'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WaitList)
class WaitListAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'date', 'time', 'party_size', 'is_active',
        'notified', 'converted_to_reservation', 'created_at'
    ]
    list_filter = ['is_active', 'notified', 'date', 'created_at']
    search_fields = ['customer__first_name', 'customer__last_name', 'customer__phone']
    readonly_fields = ['notified_at', 'created_at']
    ordering = ['-date', '-time', 'created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'converted_to_reservation'
        )


@admin.register(ReservationHistory)
class ReservationHistoryAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'action', 'performed_by', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['reservation__reservation_number', 'reservation__customer__first_name']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'reservation__customer', 'performed_by'
        )