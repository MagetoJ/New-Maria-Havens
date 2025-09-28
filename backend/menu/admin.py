from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, MenuItem, MenuItemVariation, MenuItemAddOn,
    MenuItemAddOnRelation, Recipe, RecipeIngredient, MenuDiscount
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'items_count', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['sort_order', 'name']
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Items Count'


class MenuItemVariationInline(admin.TabularInline):
    model = MenuItemVariation
    extra = 0


class MenuItemAddOnRelationInline(admin.TabularInline):
    model = MenuItemAddOnRelation
    extra = 0


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'price', 'availability_status', 'stock_quantity',
        'is_low_stock', 'is_featured', 'created_at'
    ]
    list_filter = [
        'category', 'availability_status', 'is_featured', 'is_vegetarian',
        'is_vegan', 'is_gluten_free', 'created_at'
    ]
    search_fields = ['name', 'description', 'category__name']
    ordering = ['category', 'sort_order', 'name']
    readonly_fields = ['is_available', 'is_low_stock', 'profit_margin', 'created_by', 'updated_by']
    inlines = [MenuItemVariationInline, MenuItemAddOnRelationInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'image')
        }),
        ('Pricing', {
            'fields': ('price', 'cost_price', 'profit_margin')
        }),
        ('Properties', {
            'fields': (
                'preparation_time', 'calories', 'is_vegetarian', 'is_vegan',
                'is_gluten_free', 'is_spicy', 'spice_level'
            )
        }),
        ('Availability', {
            'fields': (
                'availability_status', 'stock_quantity', 'low_stock_threshold',
                'is_available', 'is_low_stock'
            )
        }),
        ('Display', {
            'fields': ('is_featured', 'sort_order')
        }),
        ('Metadata', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def is_low_stock(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color: red;">⚠️ Low Stock</span>')
        return '✅ OK'
    is_low_stock.short_description = 'Stock Status'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(MenuItemAddOn)
class MenuItemAddOnAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['menu_item', 'prep_time', 'cook_time', 'total_time', 'difficulty_level', 'created_at']
    list_filter = ['difficulty_level', 'created_at']
    search_fields = ['menu_item__name', 'instructions']
    readonly_fields = ['total_time']
    inlines = [RecipeIngredientInline]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(MenuDiscount)
class MenuDiscountAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'discount_type', 'value', 'start_date', 'end_date',
        'is_active', 'created_at'
    ]
    list_filter = ['discount_type', 'is_active', 'start_date', 'end_date']
    search_fields = ['name', 'description']
    filter_horizontal = ['applicable_items', 'applicable_categories']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)