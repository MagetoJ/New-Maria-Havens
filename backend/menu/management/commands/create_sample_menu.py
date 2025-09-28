from django.core.management.base import BaseCommand
from django.db import transaction
from menu.models import Category, MenuItem, MenuItemAddOn, MenuItemAddOnRelation, MenuItemVariation
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create sample menu items for the Maria Havens POS system'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Create categories
            categories_data = [
                {'name': 'Appetizers', 'description': 'Start your meal with our delicious appetizers'},
                {'name': 'Main Courses', 'description': 'Our signature main dishes'},
                {'name': 'Beverages', 'description': 'Hot and cold beverages'},
                {'name': 'Desserts', 'description': 'Sweet treats to end your meal'},
                {'name': 'Salads', 'description': 'Fresh and healthy salads'},
            ]

            categories = {}
            for cat_data in categories_data:
                category, created = Category.objects.get_or_create(
                    name=cat_data['name'],
                    defaults={
                        'description': cat_data['description'],
                        'is_active': True,
                        'sort_order': len(categories) + 1
                    }
                )
                categories[cat_data['name']] = category
                if created:
                    self.stdout.write(f'Created category: {category.name}')

            # Create menu items
            menu_items_data = [
                {
                    'category': 'Appetizers',
                    'name': 'Chicken Wings',
                    'description': 'Crispy chicken wings served with your choice of sauce',
                    'price': Decimal('12.99'),
                    'preparation_time': 15,
                    'calories': 350,
                },
                {
                    'category': 'Appetizers',
                    'name': 'Mozzarella Sticks',
                    'description': 'Golden fried mozzarella sticks with marinara sauce',
                    'price': Decimal('8.99'),
                    'preparation_time': 10,
                    'calories': 280,
                },
                {
                    'category': 'Main Courses',
                    'name': 'Grilled Chicken Breast',
                    'description': 'Perfectly grilled chicken breast with herbs and spices',
                    'price': Decimal('18.99'),
                    'preparation_time': 25,
                    'calories': 420,
                },
                {
                    'category': 'Main Courses',
                    'name': 'Beef Steak',
                    'description': 'Premium beef steak cooked to your preference',
                    'price': Decimal('28.99'),
                    'preparation_time': 30,
                    'calories': 580,
                },
                {
                    'category': 'Main Courses',
                    'name': 'Fish and Chips',
                    'description': 'Classic fish and chips with tartar sauce',
                    'price': Decimal('16.99'),
                    'preparation_time': 20,
                    'calories': 650,
                },
                {
                    'category': 'Beverages',
                    'name': 'Coca Cola',
                    'description': 'Classic Coca Cola',
                    'price': Decimal('2.99'),
                    'preparation_time': 1,
                    'calories': 140,
                },
                {
                    'category': 'Beverages',
                    'name': 'Fresh Orange Juice',
                    'description': 'Freshly squeezed orange juice',
                    'price': Decimal('4.99'),
                    'preparation_time': 3,
                    'calories': 110,
                },
                {
                    'category': 'Beverages',
                    'name': 'Coffee',
                    'description': 'Freshly brewed coffee',
                    'price': Decimal('3.49'),
                    'preparation_time': 5,
                    'calories': 5,
                },
                {
                    'category': 'Salads',
                    'name': 'Caesar Salad',
                    'description': 'Classic Caesar salad with croutons and parmesan',
                    'price': Decimal('11.99'),
                    'preparation_time': 8,
                    'calories': 320,
                },
                {
                    'category': 'Salads',
                    'name': 'Greek Salad',
                    'description': 'Traditional Greek salad with feta cheese and olives',
                    'price': Decimal('10.99'),
                    'preparation_time': 8,
                    'calories': 280,
                },
                {
                    'category': 'Desserts',
                    'name': 'Chocolate Cake',
                    'description': 'Rich chocolate cake with chocolate frosting',
                    'price': Decimal('6.99'),
                    'preparation_time': 5,
                    'calories': 450,
                },
                {
                    'category': 'Desserts',
                    'name': 'Ice Cream Sundae',
                    'description': 'Vanilla ice cream with chocolate sauce and whipped cream',
                    'price': Decimal('5.99'),
                    'preparation_time': 5,
                    'calories': 380,
                },
            ]

            for item_data in menu_items_data:
                category = categories[item_data['category']]
                menu_item, created = MenuItem.objects.get_or_create(
                    name=item_data['name'],
                    category=category,
                    defaults={
                        'description': item_data['description'],
                        'price': item_data['price'],
                        'preparation_time': item_data['preparation_time'],
                        'calories': item_data['calories'],
                        'availability_status': 'available',
                        'is_featured': False,
                        'stock_quantity': 50,
                    }
                )
                if created:
                    self.stdout.write(f'Created menu item: {menu_item.name}')

            # Create some add-ons
            addons_data = [
                {'name': 'Extra Cheese', 'description': 'Add extra cheese to your dish', 'price': Decimal('1.50')},
                {'name': 'Extra Sauce', 'description': 'Additional sauce portion', 'price': Decimal('0.75')},
                {'name': 'Bacon', 'description': 'Crispy bacon strips', 'price': Decimal('2.50')},
                {'name': 'Avocado', 'description': 'Fresh sliced avocado', 'price': Decimal('2.00')},
            ]

            for addon_data in addons_data:
                addon, created = MenuItemAddOn.objects.get_or_create(
                    name=addon_data['name'],
                    defaults={
                        'description': addon_data['description'],
                        'price': addon_data['price'],
                        'is_available': True,
                    }
                )
                if created:
                    self.stdout.write(f'Created add-on: {addon.name}')

        self.stdout.write(
            self.style.SUCCESS('Sample menu creation completed!')
        )