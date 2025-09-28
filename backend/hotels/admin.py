from django.contrib import admin
from django.utils.html import format_html
from .models import RoomType, Room, RoomBooking, RoomService, RoomMaintenance


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_price', 'max_occupancy', 'room_count', 'available_count', 'is_active']
    list_filter = ['is_active', 'max_occupancy']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def room_count(self, obj):
        return obj.rooms.count()
    room_count.short_description = 'Total Rooms'
    
    def available_count(self, obj):
        count = obj.rooms.filter(status='available', is_active=True).count()
        return format_html('<span style="color: green;">{}</span>', count)
    available_count.short_description = 'Available'


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['number', 'room_type', 'floor', 'status', 'view_type', 'is_active', 'last_cleaned']
    list_filter = ['status', 'floor', 'room_type', 'is_active']
    search_fields = ['number', 'room_type__name', 'view_type']
    list_editable = ['status', 'is_active']
    ordering = ['number']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('number', 'room_type', 'floor', 'status')
        }),
        ('Details', {
            'fields': ('view_type', 'notes', 'is_active')
        }),
        ('Maintenance', {
            'fields': ('last_cleaned', 'last_maintenance'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['created_at', 'updated_at']


class RoomServiceInline(admin.TabularInline):
    model = RoomService
    extra = 0
    readonly_fields = ['requested_by', 'created_at', 'completed_at']


@admin.register(RoomBooking)
class RoomBookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_number', 'customer', 'room', 'check_in_date', 
        'check_out_date', 'nights', 'status', 'total_amount', 'created_at'
    ]
    list_filter = ['status', 'source', 'check_in_date', 'created_at']
    search_fields = [
        'booking_number', 'customer__first_name', 'customer__last_name',
        'customer__phone', 'room__number'
    ]
    readonly_fields = [
        'booking_number', 'nights', 'total_room_charges', 'total_amount',
        'created_by', 'checked_in_by', 'checked_out_by', 'created_at',
        'updated_at', 'checked_in_at', 'checked_out_at'
    ]
    inlines = [RoomServiceInline]
    ordering = ['-created_at']
    date_hierarchy = 'check_in_date'
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('booking_number', 'customer', 'room', 'source')
        }),
        ('Dates & Guests', {
            'fields': ('check_in_date', 'check_out_date', 'nights', 'adults', 'children', 'arrival_time')
        }),
        ('Pricing', {
            'fields': ('room_rate', 'total_room_charges', 'tax_amount', 'additional_charges', 'discount_amount', 'total_amount')
        }),
        ('Status & Requests', {
            'fields': ('status', 'special_requests')
        }),
        ('Staff & Timestamps', {
            'fields': (
                'created_by', 'checked_in_by', 'checked_out_by',
                'created_at', 'updated_at', 'checked_in_at', 'checked_out_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'room', 'created_by', 'checked_in_by', 'checked_out_by'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RoomService)
class RoomServiceAdmin(admin.ModelAdmin):
    list_display = [
        'booking', 'room_number', 'service_type', 'priority',
        'status', 'charge', 'assigned_to', 'created_at'
    ]
    list_filter = ['service_type', 'status', 'priority', 'created_at']
    search_fields = ['booking__booking_number', 'booking__room__number', 'description']
    readonly_fields = ['requested_by', 'created_at', 'completed_at']
    ordering = ['-priority', 'created_at']
    
    def room_number(self, obj):
        return obj.booking.room.number
    room_number.short_description = 'Room'
    room_number.admin_order_field = 'booking__room__number'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'booking__room', 'booking__customer', 'requested_by', 'assigned_to'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.requested_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RoomMaintenance)
class RoomMaintenanceAdmin(admin.ModelAdmin):
    list_display = [
        'room', 'maintenance_type', 'title', 'priority', 'status',
        'scheduled_date', 'assigned_to', 'estimated_cost', 'actual_cost'
    ]
    list_filter = ['maintenance_type', 'status', 'priority', 'scheduled_date']
    search_fields = ['room__number', 'title', 'description']
    readonly_fields = ['created_by', 'created_at', 'started_at', 'completed_at']
    ordering = ['-priority', 'scheduled_date']
    date_hierarchy = 'scheduled_date'
    
    fieldsets = (
        ('Maintenance Details', {
            'fields': ('room', 'maintenance_type', 'title', 'description', 'priority')
        }),
        ('Scheduling', {
            'fields': ('scheduled_date', 'estimated_duration', 'status', 'assigned_to')
        }),
        ('Costs', {
            'fields': ('estimated_cost', 'actual_cost')
        }),
        ('Tracking', {
            'fields': ('created_by', 'created_at', 'started_at', 'completed_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'room', 'assigned_to', 'created_by'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)