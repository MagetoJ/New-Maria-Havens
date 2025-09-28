from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users for the Maria Havens POS system'

    def handle(self, *args, **options):
        test_users = [
            {
                'email': 'admin@mariahavens.com',
                'password': 'admin123',
                'role': 'admin',
                'first_name': 'John',
                'last_name': 'Kamau',
                'username': 'admin',
                'employee_id': 'EMP001',
                'is_superuser': True,
                'is_staff': True,
            },
            {
                'email': 'manager@mariahavens.com',
                'password': 'manager123',
                'role': 'manager',
                'first_name': 'Sarah',
                'last_name': 'Wanjiku',
                'username': 'manager',
                'employee_id': 'EMP002',
                'is_staff': True,
            },
            {
                'email': 'receptionist@mariahavens.com',
                'password': 'reception123',
                'role': 'receptionist',
                'first_name': 'Peter',
                'last_name': 'Mwangi',
                'username': 'receptionist',
                'employee_id': 'EMP003',
            },
            {
                'email': 'waiter@mariahavens.com',
                'password': 'waiter123',
                'role': 'waiter',
                'first_name': 'Grace',
                'last_name': 'Akinyi',
                'username': 'waiter',
                'employee_id': 'EMP004',
            },
            {
                'email': 'kitchen@mariahavens.com',
                'password': 'kitchen123',
                'role': 'kitchen',
                'first_name': 'David',
                'last_name': 'Ochieng',
                'username': 'kitchen',
                'employee_id': 'EMP005',
            },
        ]

        with transaction.atomic():
            for user_data in test_users:
                email = user_data['email']
                
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    self.stdout.write(
                        self.style.WARNING(f'User {email} already exists, skipping...')
                    )
                    continue

                # Extract password before creating user
                password = user_data.pop('password')
                
                # Create user
                user = User.objects.create_user(**user_data)
                user.set_password(password)
                user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created user: {email} ({user.role})')
                )

        self.stdout.write(
            self.style.SUCCESS('Test users creation completed!')
        )