import requests
import json

# Test API endpoints
BASE_URL = "http://localhost:8000/api"

def test_api_endpoints():
    print("Testing API endpoints...")
    
    # Test menu categories
    try:
        response = requests.get(f"{BASE_URL}/menu/categories/")
        print(f"✓ Menu categories: {response.status_code}")
        if response.status_code == 200:
            categories = response.json()
            print(f"  Found {categories['count']} categories")
    except Exception as e:
        print(f"✗ Menu categories failed: {e}")
    
    # Test menu items
    try:
        response = requests.get(f"{BASE_URL}/menu/items/")
        print(f"✓ Menu items: {response.status_code}")
        if response.status_code == 200:
            items = response.json()
            print(f"  Found {items['count']} menu items")
    except Exception as e:
        print(f"✗ Menu items failed: {e}")
    
    # Test tables
    try:
        response = requests.get(f"{BASE_URL}/orders/tables/")
        print(f"✓ Tables: {response.status_code}")
        if response.status_code == 200:
            tables = response.json()
            print(f"  Found {tables['count']} tables")
    except Exception as e:
        print(f"✗ Tables failed: {e}")
    
    # Test orders
    try:
        response = requests.get(f"{BASE_URL}/orders/orders/")
        print(f"✓ Orders: {response.status_code}")
        if response.status_code == 200:
            orders = response.json()
            print(f"  Found {orders['count']} existing orders")
    except Exception as e:
        print(f"✗ Orders failed: {e}")
    
    # Test creating a new order
    try:
        # Get first available table
        tables_response = requests.get(f"{BASE_URL}/orders/tables/")
        tables = tables_response.json()['results']
        available_table = next((t for t in tables if not t['is_occupied']), None)
        
        if available_table:
            # Create new order
            new_order = {
                "table": available_table['id'],
                "order_type": "dine_in",
                "customer_name": "Test Customer",
                "notes": "Test order from API"
            }
            
            response = requests.post(
                f"{BASE_URL}/orders/orders/",
                json=new_order,
                headers={'Content-Type': 'application/json'}
            )
            print(f"✓ Create order: {response.status_code}")
            
            if response.status_code == 201:
                order = response.json()
                print(f"  Created order: {order['order_number']}")
                
                # Try to add an item to the order
                items_response = requests.get(f"{BASE_URL}/menu/items/")
                menu_items = items_response.json()['results']
                if menu_items:
                    first_item = menu_items[0]
                    order_item = {
                        "order": order['id'],
                        "menu_item_id": first_item['id'],
                        "quantity": 2,
                        "special_instructions": "Extra spicy"
                    }
                    
                    item_response = requests.post(
                        f"{BASE_URL}/orders/order-items/",
                        json=order_item,
                        headers={'Content-Type': 'application/json'}
                    )
                    print(f"✓ Add order item: {item_response.status_code}")
                    
                    if item_response.status_code == 201:
                        print(f"  Added item: {first_item['name']} x2")
                        
                        # Try to confirm the order
                        confirm_response = requests.post(
                            f"{BASE_URL}/orders/orders/{order['id']}/confirm/",
                            headers={'Content-Type': 'application/json'}
                        )
                        print(f"✓ Confirm order: {confirm_response.status_code}")
                        
                        if confirm_response.status_code == 200:
                            print("  Order confirmed successfully!")
                    else:
                        print(f"  Error adding item: {item_response.text[:200]}")
            else:
                print(f"  Error creating order: {response.text}")
        else:
            print("  No available tables found")
            
    except Exception as e:
        print(f"✗ Create order failed: {e}")

if __name__ == "__main__":
    test_api_endpoints()