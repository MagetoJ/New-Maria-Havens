from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
# backend/menu/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuItemViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'items', MenuItemViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

router = DefaultRouter()
router.register(r'items', MenuItemViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'items', views.MenuItemViewSet)
router.register(r'addons', views.MenuItemAddOnViewSet)
router.register(r'discounts', views.MenuDiscountViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.menu_stats, name='menu_stats'),
    path('bulk-update-stock/', views.bulk_update_stock, name='bulk_update_stock'),
]