#!/usr/bin/env python3
import requests
import json

def test_login():
    try:
        response = requests.post('http://localhost:8000/api/accounts/login/', 
                               json={'email': 'admin@mariahavens.com', 'password': 'admin123'}, 
                               timeout=5)
        print(f'Login Test: Status {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f'User: {user.get("first_name", "N/A")} {user.get("last_name", "N/A")}')
            print(f'Role: {user.get("role", "N/A")}')
            print('✅ Authentication working!')
            return True
        else:
            print(f'❌ Login failed: {response.text}')
            return False
    except Exception as e:
        print(f'Login Test Error: {e}')
        return False

def test_menu_api():
    try:
        response = requests.get('http://localhost:8000/api/menu/items/', timeout=5)
        print(f'Menu API: Status {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('results', data if isinstance(data, list) else []))
            print(f'Menu items available: {count}')
            print('✅ Menu API working!')
            return True
        else:
            print(f'❌ Menu API failed: {response.text}')
            return False
    except Exception as e:
        print(f'Menu API Error: {e}')
        return False

if __name__ == "__main__":
    print("🔍 Testing Maria Havens POS System APIs...")
    auth_ok = test_login()
    menu_ok = test_menu_api()
    
    if auth_ok and menu_ok:
        print("\n✅ All critical APIs working!")
    else:
        print("\n⚠️ Some APIs need attention")