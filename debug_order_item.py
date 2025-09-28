import requests
import json

BASE_URL = "http://localhost:8000/api"

def debug_order_item_creation():
    print("Debugging order item creation...")
    
    # Get first menu item
    items_response = requests.get(f"{BASE_URL}/menu/items/")
    if items_response.status_code != 200:
        print(f"Failed to get menu items: {items_response.status_code}")
        return
    
    menu_items = items_response.json()['results']
    if not menu_items:
        print("No menu items found")
        return
    
    first_item = menu_items[0]
    print(f"Found menu item: {first_item['name']} (ID: {first_item['id']}, Price: {first_item['price']})")
    
    # Get first order
    orders_response = requests.get(f"{BASE_URL}/orders/orders/")
    if orders_response.status_code != 200:
        print(f"Failed to get orders: {orders_response.status_code}")
        return
        
    orders = orders_response.json()['results']
    if not orders:
        print("No orders found")
        return
    
    first_order = orders[0]
    print(f"Found order: {first_order['order_number']} (ID: {first_order['id']})")
    
    # Try to create order item
    order_item = {
        "order": first_order['id'],
        "menu_item_id": first_item['id'],
        "quantity": 1,
        "unit_price": first_item['price'],  # Explicitly provide unit_price
        "special_instructions": "Debug test"
    }
    
    print(f"Creating order item with data: {json.dumps(order_item, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/orders/order-items/",
        json=order_item,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 201:
        print("Order item created successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    debug_order_item_creation()