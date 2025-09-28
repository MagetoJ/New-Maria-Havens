from django.core.management.base import BaseCommand
from orders.models import Table

class Command(BaseCommand):
    help = 'Create sample tables for the restaurant'

    def handle(self, *args, **options):
        # Delete existing tables
        Table.objects.all().delete()
        
        # Create sample tables
        tables_data = [
            {'number': '1', 'capacity': 2, 'section': 'Window'},
            {'number': '2', 'capacity': 2, 'section': 'Window'},
            {'number': '3', 'capacity': 4, 'section': 'Center'},
            {'number': '4', 'capacity': 4, 'section': 'Center'},
            {'number': '5', 'capacity': 6, 'section': 'Private'},
            {'number': '6', 'capacity': 6, 'section': 'Private'},
            {'number': '7', 'capacity': 8, 'section': 'Private'},
            {'number': '8', 'capacity': 2, 'section': 'Bar'},
            {'number': '9', 'capacity': 2, 'section': 'Bar'},
            {'number': '10', 'capacity': 4, 'section': 'Patio'},
            {'number': '11', 'capacity': 4, 'section': 'Patio'},
            {'number': '12', 'capacity': 6, 'section': 'Patio'},
        ]
        
        for table_data in tables_data:
            table = Table.objects.create(**table_data)
            self.stdout.write(
                self.style.SUCCESS(f'Created table {table.number} with capacity {table.capacity}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {len(tables_data)} tables')
        )