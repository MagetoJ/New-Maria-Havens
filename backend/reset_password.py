import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maria_havens_pos.settings')
django.setup()

from accounts.models import User

try:
    user = User.objects.get(email='admin@mariahavens.com')
    user.set_password('admin123')
    user.save()
    print(f'Password reset for {user.email}')
    print(f'User details: {user.username}, {user.first_name} {user.last_name}, role: {user.role}')
except User.DoesNotExist:
    print('User not found')