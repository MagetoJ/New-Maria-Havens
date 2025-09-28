import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maria_havens_pos.settings')
django.setup()

from accounts.models import User

try:
    user = User.objects.get(email='admin@mariahavens.com')
    user.username = 'admin'
    user.first_name = 'John'
    user.last_name = 'Kamau'
    user.role = 'admin'
    user.is_staff = True
    user.is_superuser = True
    user.set_password('admin123')
    user.save()
    print(f'Updated user: {user.email}')
    print(f'Role: {user.role}, Name: {user.first_name} {user.last_name}')
except User.DoesNotExist:
    print('User not found')