from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'menu_category'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return self.name


class MenuItem(models.Model):
    AVAILABILITY_CHOICES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
        ('seasonal', 'Seasonal'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    preparation_time = models.IntegerField(help_text='Preparation time in minutes', default=15)
    calories = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    spice_level = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='available')
    stock_quantity = models.IntegerField(default=0, help_text='Current stock quantity')
    low_stock_threshold = models.IntegerField(default=10, help_text='Alert when stock is below this number')
    is_featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_menu_items')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_menu_items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'menu_item'
        verbose_name = 'Menu Item'
        verbose_name_plural = 'Menu Items'
        ordering = ['category', 'sort_order', 'name']
    
    def __str__(self):
        return f"{self.name} - KSh {self.price}"
    
    @property
    def is_available(self):
        return self.availability_status == 'available' and self.stock_quantity > 0
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def profit_margin(self):
        if self.cost_price:
            return ((self.price - self.cost_price) / self.price) * 100
        return 0


class MenuItemVariation(models.Model):
    SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
        ('extra_large', 'Extra Large'),
    ]
    
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=100, help_text='e.g., Small, Medium, Large')
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True)
    price_modifier = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text='Additional price for this variation')
    is_default = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'menu_item_variation'
        verbose_name = 'Menu Item Variation'
        verbose_name_plural = 'Menu Item Variations'
        unique_together = ['menu_item', 'name']
    
    def __str__(self):
        return f"{self.menu_item.name} - {self.name}"
    
    @property
    def final_price(self):
        return self.menu_item.price + self.price_modifier


class MenuItemAddOn(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'menu_item_addon'
        verbose_name = 'Menu Item Add-on'
        verbose_name_plural = 'Menu Item Add-ons'
    
    def __str__(self):
        return f"{self.name} - KSh {self.price}"


class MenuItemAddOnRelation(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='addon_relations')
    addon = models.ForeignKey(MenuItemAddOn, on_delete=models.CASCADE)
    is_required = models.BooleanField(default=False)
    max_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    
    class Meta:
        db_table = 'menu_item_addon_relation'
        unique_together = ['menu_item', 'addon']
    
    def __str__(self):
        return f"{self.menu_item.name} - {self.addon.name}"


class Recipe(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
        ('l', 'Liters'),
        ('ml', 'Milliliters'),
        ('pcs', 'Pieces'),
        ('cups', 'Cups'),
        ('tbsp', 'Tablespoons'),
        ('tsp', 'Teaspoons'),
    ]
    
    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name='recipe')
    instructions = models.TextField(help_text='Cooking instructions')
    prep_time = models.IntegerField(help_text='Preparation time in minutes')
    cook_time = models.IntegerField(help_text='Cooking time in minutes')
    servings = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    difficulty_level = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)], 
        default=3, 
        help_text='Difficulty level from 1 (easy) to 5 (very hard)'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'menu_recipe'
        verbose_name = 'Recipe'
        verbose_name_plural = 'Recipes'
    
    def __str__(self):
        return f"Recipe for {self.menu_item.name}"
    
    @property
    def total_time(self):
        return self.prep_time + self.cook_time


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20, choices=Recipe.UNIT_CHOICES)
    notes = models.TextField(blank=True, help_text='Special preparation notes for this ingredient')
    
    class Meta:
        db_table = 'menu_recipe_ingredient'
        verbose_name = 'Recipe Ingredient'
        verbose_name_plural = 'Recipe Ingredients'
    
    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.name}"


class MenuDiscount(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
        ('bogo', 'Buy One Get One'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    value = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    applicable_items = models.ManyToManyField(MenuItem, blank=True, related_name='discounts')
    applicable_categories = models.ManyToManyField(Category, blank=True, related_name='discounts')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'menu_discount'
        verbose_name = 'Menu Discount'
        verbose_name_plural = 'Menu Discounts'
    
    def __str__(self):
        return self.name
    
    def calculate_discount(self, amount):
        if self.discount_type == 'percentage':
            discount = (amount * self.value) / 100
        else:  # fixed
            discount = self.value
        
        if self.max_discount_amount and discount > self.max_discount_amount:
            discount = self.max_discount_amount
        
        return min(discount, amount)