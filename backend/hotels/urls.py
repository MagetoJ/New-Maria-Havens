from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'room-types', views.RoomTypeViewSet)
router.register(r'rooms', views.RoomViewSet)
router.register(r'bookings', views.RoomBookingViewSet)
router.register(r'services', views.RoomServiceViewSet)
router.register(r'maintenance', views.RoomMaintenanceViewSet)

urlpatterns = [
    path('api/hotels/', include(router.urls)),
]