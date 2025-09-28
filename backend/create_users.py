import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maria_havens_pos.settings')
django.setup()

from accounts.models import User

# Create test users based on the frontend mock data
users_data = [
    {'username': 'admin', 'email': 'admin@mariahavens.com', 'password': 'admin123', 'first_name': 'John', 'last_name': 'Kamau', 'role': 'admin'},
    {'username': 'manager', 'email': 'manager@mariahavens.com', 'password': 'manager123', 'first_name': 'Sarah', 'last_name': 'Wanjiku', 'role': 'manager'},
    {'username': 'receptionist', 'email': 'receptionist@mariahavens.com', 'password': 'reception123', 'first_name': 'Peter', 'last_name': 'Mwangi', 'role': 'receptionist'},
    {'username': 'waiter', 'email': 'waiter@mariahavens.com', 'password': 'waiter123', 'first_name': 'Grace', 'last_name': 'Akinyi', 'role': 'waiter'},
    {'username': 'kitchen', 'email': 'kitchen@mariahavens.com', 'password': 'kitchen123', 'first_name': 'David', 'last_name': 'Ochieng', 'role': 'kitchen'}
]

for user_data in users_data:
    try:
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=user_data['role']
        )
        print(f'Created user: {user.email} with role: {user.role}')
    except Exception as e:
        print(f'User {user_data["email"]} already exists or error: {e}')

print('User creation completed!')