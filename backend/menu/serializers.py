from rest_framework import serializers
from .models import (
    Category, MenuItem, MenuItemVariation, MenuItemAddOn, 
    MenuItemAddOnRelation, Recipe, RecipeIngredient, MenuDiscount
)


class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'image', 'sort_order', 
            'is_active', 'items_count', 'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.filter(availability_status='available').count()


class MenuItemVariationSerializer(serializers.ModelSerializer):
    final_price = serializers.ReadOnlyField()
    
    class Meta:
        model = MenuItemVariation
        fields = [
            'id', 'name', 'size', 'price_modifier', 'final_price',
            'is_default', 'is_available'
        ]


class MenuItemAddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemAddOn
        fields = ['id', 'name', 'description', 'price', 'is_available']


class MenuItemAddOnRelationSerializer(serializers.ModelSerializer):
    addon = MenuItemAddOnSerializer(read_only=True)
    addon_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = MenuItemAddOnRelation
        fields = ['id', 'addon', 'addon_id', 'is_required', 'max_quantity']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['id', 'name', 'quantity', 'unit', 'notes']


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    total_time = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'instructions', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty_level', 'created_by_name', 'ingredients',
            'created_at', 'updated_at'
        ]


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    variations = MenuItemVariationSerializer(many=True, read_only=True)
    addon_relations = MenuItemAddOnRelationSerializer(many=True, read_only=True)
    recipe = RecipeSerializer(read_only=True)
    is_available = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'category', 'category_name', 'price', 'cost_price',
            'image', 'preparation_time', 'calories', 'is_vegetarian', 'is_vegan',
            'is_gluten_free', 'is_spicy', 'spice_level', 'availability_status',
            'stock_quantity', 'low_stock_threshold', 'is_featured', 'sort_order',
            'is_available', 'is_low_stock', 'profit_margin', 'variations',
            'addon_relations', 'recipe', 'created_by_name', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class MenuItemCreateSerializer(serializers.ModelSerializer):
    variations = MenuItemVariationSerializer(many=True, required=False)
    addons = serializers.ListField(
        child=serializers.IntegerField(), 
        required=False,
        help_text="List of addon IDs"
    )
    
    class Meta:
        model = MenuItem
        fields = [
            'name', 'description', 'category', 'price', 'cost_price', 'image',
            'preparation_time', 'calories', 'is_vegetarian', 'is_vegan',
            'is_gluten_free', 'is_spicy', 'spice_level', 'availability_status',
            'stock_quantity', 'low_stock_threshold', 'is_featured', 'sort_order',
            'variations', 'addons'
        ]
    
    def create(self, validated_data):
        variations_data = validated_data.pop('variations', [])
        addons_data = validated_data.pop('addons', [])
        validated_data['created_by'] = self.context['request'].user
        
        menu_item = MenuItem.objects.create(**validated_data)
        
        # Create variations
        for variation_data in variations_data:
            MenuItemVariation.objects.create(menu_item=menu_item, **variation_data)
        
        # Create addon relations
        for addon_id in addons_data:
            try:
                addon = MenuItemAddOn.objects.get(id=addon_id)
                MenuItemAddOnRelation.objects.create(
                    menu_item=menu_item,
                    addon=addon,
                    is_required=False,
                    max_quantity=1
                )
            except MenuItemAddOn.DoesNotExist:
                pass
        
        return menu_item


class MenuItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_available = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'category_name', 'price', 'image',
            'availability_status', 'stock_quantity', 'is_featured',
            'is_available', 'is_low_stock', 'preparation_time'
        ]


class MenuDiscountSerializer(serializers.ModelSerializer):
    applicable_items_names = serializers.SerializerMethodField()
    applicable_categories_names = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = MenuDiscount
        fields = [
            'id', 'name', 'description', 'discount_type', 'value',
            'min_order_amount', 'max_discount_amount', 'start_date', 'end_date',
            'is_active', 'applicable_items', 'applicable_categories',
            'applicable_items_names', 'applicable_categories_names',
            'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']
    
    def get_applicable_items_names(self, obj):
        return [item.name for item in obj.applicable_items.all()]
    
    def get_applicable_categories_names(self, obj):
        return [category.name for category in obj.applicable_categories.all()]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class MenuStatsSerializer(serializers.Serializer):
    total_items = serializers.IntegerField()
    available_items = serializers.IntegerField()
    unavailable_items = serializers.IntegerField()
    low_stock_items = serializers.IntegerField()
    featured_items = serializers.IntegerField()
    categories_count = serializers.IntegerField()
    average_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_discounts = serializers.IntegerField()