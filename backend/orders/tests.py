from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from menu.models import MenuItem, Category
from .models import Order, OrderItem, Table

User = get_user_model()


class OrderTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='server'
        )
        
        # Create test table
        self.table = Table.objects.create(
            number='1',
            capacity=4,
            section='Main'
        )
        
        # Create test menu category
        self.category = Category.objects.create(
            name='Test Category',
            description='Test category for testing'
        )
        
        # Create test menu item
        self.menu_item = MenuItem.objects.create(
            name='Test Burger',
            description='A delicious test burger',
            category=self.category,
            price=Decimal('15.99'),
            preparation_time=20
        )
        
    def test_create_order_with_valid_data(self):
        """Test creating an order with valid data"""
        order_data = {
            'table_id': self.table.id,
            'customer_name': 'John Doe',
            'order_type': 'dine_in',
            'special_instructions': 'No onions please'
        }
        
        response = self.client.post('/api/orders/orders/', order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('order_number', response.data)
        self.assertEqual(response.data['customer_name'], 'John Doe')
        self.assertEqual(response.data['order_type'], 'dine_in')
        
        # Check that order was created in database
        self.assertTrue(Order.objects.filter(customer_name='John Doe').exists())
        
    def test_add_items_to_order(self):
        """Test adding items to an order"""
        # First create an order
        order = Order.objects.create(
            table=self.table,
            customer_name='Jane Doe',
            order_type='dine_in'
        )
        
        # Add item to order
        item_data = {
            'order': order.id,
            'menu_item_id': self.menu_item.id,
            'quantity': 2,
            'special_instructions': 'Extra crispy'
        }
        
        response = self.client.post('/api/orders/order-items/', item_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 2)
        self.assertEqual(response.data['unit_price'], str(self.menu_item.price))
        self.assertEqual(response.data['subtotal'], str(Decimal('31.98')))  # 15.99 * 2
        
    def test_calculate_order_total_correctly(self):
        """Test that order total is calculated correctly"""
        order = Order.objects.create(
            table=self.table,
            customer_name='Test Customer',
            order_type='dine_in'
        )
        
        # Add multiple items
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item,
            quantity=2,
            unit_price=self.menu_item.price
        )
        
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item,
            quantity=1,
            unit_price=self.menu_item.price
        )
        
        # Refresh order from database
        order.refresh_from_db()
        
        expected_subtotal = Decimal('47.97')  # (15.99 * 2) + (15.99 * 1)
        self.assertEqual(order.subtotal, expected_subtotal)
        self.assertEqual(order.total_amount, expected_subtotal)  # No tax/discount in test
        
    def test_confirm_order_status_change(self):
        """Test confirming an order changes its status"""
        order = Order.objects.create(
            table=self.table,
            customer_name='Test Customer',
            order_type='dine_in',
            status='pending'
        )
        
        # Add an item to make it a valid order
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item,
            quantity=1,
            unit_price=self.menu_item.price
        )
        
        # Confirm the order
        response = self.client.post(f'/api/orders/orders/{order.id}/confirm/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check status was updated
        order.refresh_from_db()
        self.assertEqual(order.status, 'confirmed')
        self.assertIsNotNone(order.confirmed_at)
        
    def test_create_order_without_table(self):
        """Test creating an order without specifying a table"""
        order_data = {
            'customer_name': 'Takeout Customer',
            'order_type': 'takeaway',
            'special_instructions': 'For pickup'
        }
        
        response = self.client.post('/api/orders/orders/', order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['table'])
        self.assertEqual(response.data['order_type'], 'takeaway')
        
    def test_add_invalid_menu_item(self):
        """Test adding an invalid menu item to order"""
        order = Order.objects.create(
            table=self.table,
            customer_name='Test Customer',
            order_type='dine_in'
        )
        
        # Try to add non-existent menu item
        item_data = {
            'order': order.id,
            'menu_item_id': 99999,  # Non-existent ID
            'quantity': 1
        }
        
        response = self.client.post('/api/orders/order-items/', item_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_handle_anonymous_user_creation(self):
        """Test that orders can be created by anonymous users"""
        # Don't authenticate the client (anonymous user)
        order_data = {
            'table_id': self.table.id,
            'customer_name': 'Anonymous Customer',
            'order_type': 'dine_in'
        }
        
        response = self.client.post('/api/orders/orders/', order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check order was created with no server assigned
        order = Order.objects.get(id=response.data['id'])
        self.assertIsNone(order.server)
        
    def test_menu_item_stock_tracking(self):
        """Test that menu item stock is properly tracked"""
        # Set initial stock
        self.menu_item.stock_quantity = 5
        self.menu_item.low_stock_threshold = 2
        self.menu_item.save()
        
        # Check initial stock status
        self.assertFalse(self.menu_item.is_low_stock)
        
        # Update stock to low level
        self.menu_item.stock_quantity = 1
        self.menu_item.save()
        
        # Check low stock status
        self.assertTrue(self.menu_item.is_low_stock)
        
        # Check availability when out of stock
        self.menu_item.stock_quantity = 0
        self.menu_item.save()
        
        self.assertFalse(self.menu_item.is_available)


class TableTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.table = Table.objects.create(
            number='5',
            capacity=6,
            section='Patio'
        )
        
    def test_occupy_table(self):
        """Test marking a table as occupied"""
        response = self.client.post(f'/api/orders/tables/{self.table.id}/occupy/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'table occupied')
        
        # Check database was updated
        self.table.refresh_from_db()
        self.assertTrue(self.table.is_occupied)
        
    def test_free_table(self):
        """Test marking an occupied table as free"""
        # First occupy the table
        self.table.is_occupied = True
        self.table.save()
        
        response = self.client.post(f'/api/orders/tables/{self.table.id}/free/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'table freed')
        
        # Check database was updated
        self.table.refresh_from_db()
        self.assertFalse(self.table.is_occupied)
        
    def test_get_available_tables(self):
        """Test retrieving available tables"""
        # Create occupied and available tables
        Table.objects.create(number='10', capacity=4, is_occupied=True)
        Table.objects.create(number='11', capacity=4, is_occupied=False)
        
        response = self.client.get('/api/orders/tables/available/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that only available tables are returned
        table_numbers = [t['number'] for t in response.data]
        self.assertIn('5', table_numbers)  # Our test table
        self.assertIn('11', table_numbers)  # Available table
        self.assertNotIn('10', table_numbers)  # Occupied table


class MenuItemTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.category = MenuCategory.objects.create(
            name='Beverages',
            description='Drinks and beverages'
        )
        
    def test_menu_items_list(self):
        """Test retrieving menu items list"""
        # Create test menu items
        MenuItem.objects.create(
            name='Coca Cola',
            category=self.category,
            price=Decimal('2.99')
        )
        MenuItem.objects.create(
            name='Orange Juice',
            category=self.category,
            price=Decimal('3.99')
        )
        
        response = self.client.get('/api/menu/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Check items are returned with proper data
        items = response.data['results']
        item_names = [item['name'] for item in items]
        self.assertIn('Coca Cola', item_names)
        self.assertIn('Orange Juice', item_names)
        
    def test_menu_categories_list(self):
        """Test retrieving menu categories list"""
        # Create additional category
        MenuCategory.objects.create(
            name='Desserts',
            description='Sweet treats'
        )
        
        response = self.client.get('/api/menu/categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Check categories are returned
        categories = response.data['results']
        category_names = [cat['name'] for cat in categories]
        self.assertIn('Beverages', category_names)
        self.assertIn('Desserts', category_names)