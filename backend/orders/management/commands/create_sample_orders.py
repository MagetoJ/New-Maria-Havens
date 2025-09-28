from django.core.management.base import BaseCommand
from django.utils import timezone
from orders.models import Table, Order, OrderItem
from menu.models import MenuItem
from decimal import Decimal

class Command(BaseCommand):
    help = 'Create sample orders for demonstration'

    def handle(self, *args, **options):
        # Get some tables and menu items
        tables = Table.objects.all()[:6]
        menu_items = list(MenuItem.objects.filter(availability_status='available'))
        
        if not tables.exists():
            self.stdout.write(
                self.style.ERROR('No tables found. Please run create_sample_tables first.')
            )
            return
            
        if not menu_items:
            self.stdout.write(
                self.style.ERROR('No menu items found. Please run create_sample_data first.')
            )
            return
        
        # Delete existing orders
        Order.objects.all().delete()
        
        # Create sample orders
        orders_data = [
            {
                'table': tables[0],
                'status': 'pending',
                'items': [menu_items[0], menu_items[1]],
                'quantities': [2, 1]
            },
            {
                'table': tables[1], 
                'status': 'confirmed',
                'items': [menu_items[2], menu_items[3], menu_items[0]],
                'quantities': [1, 2, 1]
            },
            {
                'table': tables[2],
                'status': 'preparing',
                'items': [menu_items[1], menu_items[4] if len(menu_items) > 4 else menu_items[0]],
                'quantities': [3, 2]
            },
            {
                'table': tables[3],
                'status': 'ready',
                'items': [menu_items[0], menu_items[2], menu_items[1]],
                'quantities': [1, 1, 2]
            },
        ]
        
        for order_data in orders_data:
            # Calculate total
            total = Decimal('0')
            items = order_data['items']
            quantities = order_data['quantities']
            
            for item, quantity in zip(items, quantities):
                total += item.price * quantity
            
            order = Order.objects.create(
                table=order_data['table'],
                status=order_data['status'],
                total_amount=total,
                created_at=timezone.now()
            )
            
            # Create order items
            for item, quantity in zip(items, quantities):
                OrderItem.objects.create(
                    order=order,
                    menu_item=item,
                    quantity=quantity,
                    unit_price=item.price
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created order for table {order.table.number} with {len(items)} items')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {len(orders_data)} sample orders')
        )