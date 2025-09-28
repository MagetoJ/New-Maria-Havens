from rest_framework import permissions


class RoleBasedPermission(permissions.BasePermission):
    """
    Custom permission to only allow users with appropriate roles to access objects.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin and managers have full access
        if request.user.role in ['admin', 'manager']:
            return True
            
        # For other roles, check specific permissions based on view
        if hasattr(view, 'required_roles'):
            return request.user.role in view.required_roles
            
        # For staff members, allow read access to most endpoints
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['server', 'kitchen', 'cashier']
            
        # For write operations, be more restrictive
        return request.user.role in ['admin', 'manager']
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Admin and managers have full access to all objects
        if request.user.role in ['admin', 'manager']:
            return True
            
        # Users can only edit their own objects if the object has a user field
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
            
        # Objects created by the user
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
            
        # For safe methods, allow access if user has general permission
        if request.method in permissions.SAFE_METHODS:
            return self.has_permission(request, view)
            
        return False


class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to only allow admin and manager users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )


class IsKitchenStaffOrAbove(permissions.BasePermission):
    """
    Custom permission to only allow kitchen staff, managers, and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager', 'kitchen']
        )


class IsServerOrAbove(permissions.BasePermission):
    """
    Custom permission to only allow servers, managers, and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager', 'server']
        )


class IsCashierOrAbove(permissions.BasePermission):
    """
    Custom permission to only allow cashiers, managers, and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager', 'cashier']
        )