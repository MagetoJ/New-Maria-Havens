from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserRetrieveUpdateView.as_view(), name='user_detail'),
    path('activities/', views.UserActivityListView.as_view(), name='user_activities'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
]