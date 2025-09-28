from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Table, Order, OrderItem, OrderItemAddOn, Payment, KitchenDisplay


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'section', 'is_active', 'is_occupied']
    list_filter = ['is_active', 'is_occupied', 'section']
    search_fields = ['number', 'section']
    list_editable = ['is_active', 'is_occupied']
    ordering = ['number']


class OrderItemAddOnInline(admin.TabularInline):
    model = OrderItemAddOn
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['processed_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'customer_name', 'table', 'status',
        'order_type', 'total_amount', 'created_at'
    ]
    list_filter = ['status', 'order_type', 'created_at', 'table__section']
    search_fields = ['order_number', 'customer_name', 'customer_phone', 'customer_email']
    readonly_fields = [
        'order_number', 'subtotal', 'total_amount', 'created_at',
        'updated_at', 'confirmed_at', 'served_at', 'completed_at'
    ]
    inlines = [OrderItemInline, PaymentInline]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'customer_name', 'customer_phone', 'customer_email')
        }),
        ('Service Details', {
            'fields': ('table', 'order_type', 'status', 'special_instructions', 'estimated_prep_time')
        }),
        ('Staff Assignment', {
            'fields': ('server', 'kitchen_staff')
        }),
        ('Financial', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'served_at', 'completed_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('table', 'server', 'kitchen_staff')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'unit_price', 'subtotal', 'status']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number', 'menu_item__name']
    readonly_fields = ['subtotal', 'created_at', 'updated_at']
    inlines = [OrderItemAddOnInline]
    ordering = ['-created_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'order', 'amount', 'payment_method', 'status',
        'transaction_id', 'processed_by', 'created_at'
    ]
    list_filter = ['payment_method', 'status', 'created_at']
    search_fields = ['order__order_number', 'transaction_id', 'reference_number']
    readonly_fields = ['created_at', 'processed_at']
    ordering = ['-created_at']


@admin.register(KitchenDisplay)
class KitchenDisplayAdmin(admin.ModelAdmin):
    list_display = [
        'order_item', 'station', 'priority', 'estimated_completion',
        'assigned_to', 'started_at', 'completed_at', 'is_overdue_display'
    ]
    list_filter = ['station', 'priority', 'assigned_to', 'started_at', 'completed_at']
    search_fields = ['order_item__order__order_number', 'order_item__menu_item__name']
    readonly_fields = ['created_at', 'is_overdue']
    ordering = ['priority', 'estimated_completion']
    
    def is_overdue_display(self, obj):
        if obj.is_overdue:
            return format_html('<span style="color: red; font-weight: bold;">⚠️ OVERDUE</span>')
        return '✅ On Time'
    is_overdue_display.short_description = 'Status'
    is_overdue_display.admin_order_field = 'estimated_completion'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'order_item__order', 'order_item__menu_item', 'assigned_to'
        )