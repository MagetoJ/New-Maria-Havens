from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet)
router.register(r'reservations', views.ReservationViewSet)
router.register(r'waitlist', views.WaitListViewSet)

urlpatterns = [
    path('api/reservations/', include(router.urls)),
]