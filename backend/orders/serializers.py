from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Table, Order, OrderItem, OrderItemAddOn, Payment, KitchenDisplay
from menu.serializers import MenuItemSerializer, MenuItemAddOnSerializer

User = get_user_model()


class TableSerializer(serializers.ModelSerializer):
    is_occupied = serializers.ReadOnlyField()
    
    class Meta:
        model = Table
        fields = '__all__'


class OrderItemAddOnSerializer(serializers.ModelSerializer):
    addon = MenuItemAddOnSerializer(read_only=True)
    addon_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItemAddOn
        fields = ['id', 'addon', 'addon_id', 'quantity', 'unit_price', 'subtotal']
        read_only_fields = ['subtotal']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    addons = OrderItemAddOnSerializer(many=True, required=False)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'menu_item', 'menu_item_id', 'quantity', 'unit_price',
            'subtotal', 'special_instructions', 'status', 'addons',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subtotal', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        from menu.models import MenuItem
        
        addons_data = validated_data.pop('addons', [])
        
        # Auto-populate unit_price from menu item if not provided
        if 'unit_price' not in validated_data or validated_data['unit_price'] is None:
            menu_item_id = validated_data.get('menu_item_id')
            if menu_item_id:
                try:
                    menu_item = MenuItem.objects.get(id=menu_item_id)
                    validated_data['unit_price'] = menu_item.price
                except MenuItem.DoesNotExist:
                    pass
        
        order_item = OrderItem.objects.create(**validated_data)
        
        for addon_data in addons_data:
            OrderItemAddOn.objects.create(order_item=order_item, **addon_data)
        
        return order_item


class PaymentSerializer(serializers.ModelSerializer):
    processed_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'payment_method', 'status', 'transaction_id',
            'reference_number', 'card_last_four', 'processed_by',
            'created_at', 'processed_at'
        ]
        read_only_fields = ['processed_by', 'created_at', 'processed_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    server = serializers.StringRelatedField(read_only=True)
    kitchen_staff = serializers.StringRelatedField(read_only=True)
    table = TableSerializer(read_only=True)
    table_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_phone',
            'customer_email', 'table', 'table_id', 'order_type', 'status',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'special_instructions', 'estimated_prep_time', 'server',
            'kitchen_staff', 'items', 'payments', 'created_at', 'updated_at',
            'confirmed_at', 'served_at', 'completed_at'
        ]
        read_only_fields = [
            'order_number', 'subtotal', 'total_amount', 'server',
            'kitchen_staff', 'created_at', 'updated_at', 'confirmed_at',
            'served_at', 'completed_at'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            addons_data = item_data.pop('addons', [])
            order_item = OrderItem.objects.create(order=order, **item_data)
            
            for addon_data in addons_data:
                OrderItemAddOn.objects.create(order_item=order_item, **addon_data)
        
        order.calculate_total()
        return order


class KitchenDisplaySerializer(serializers.ModelSerializer):
    order_item = OrderItemSerializer(read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    order_number = serializers.CharField(source='order_item.order.order_number', read_only=True)
    table_number = serializers.CharField(source='order_item.order.table.number', read_only=True)
    
    class Meta:
        model = KitchenDisplay
        fields = [
            'id', 'order_item', 'station', 'priority', 'estimated_completion',
            'assigned_to', 'started_at', 'completed_at', 'is_overdue',
            'order_number', 'table_number', 'created_at'
        ]
        read_only_fields = ['created_at']


class OrderSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for order lists"""
    table_number = serializers.CharField(source='table.number', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'table_number',
            'order_type', 'status', 'total_amount', 'items_count',
            'created_at', 'estimated_prep_time'
        ]