export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: "active" | "inactive"
  permissions: Permission[]
  lastLogin: string
  createdAt: string
}

export type UserRole = "admin" | "manager" | "receptionist" | "waiter" | "kitchen"

export type Permission =
  | "user_management"
  | "room_management"
  | "menu_management"
  | "reservation_management"
  | "pos_access"
  | "reports_access"
  | "settings_access"
  | "financial_access"

// Role definitions with specific permissions and functionalities
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "user_management",
    "room_management",
    "menu_management",
    "reservation_management",
    "pos_access",
    "reports_access",
    "settings_access",
    "financial_access",
  ],
  manager: [
    "room_management",
    "menu_management",
    "reservation_management",
    "pos_access",
    "reports_access",
    "financial_access",
  ],
  receptionist: ["reservation_management", "room_management"],
  waiter: ["pos_access", "menu_management"],
  kitchen: ["pos_access"],
}

// Role descriptions and functionalities
export const ROLE_DESCRIPTIONS: Record<
  UserRole,
  {
    title: string
    description: string
    capabilities: string[]
  }
> = {
  admin: {
    title: "Administrator",
    description: "Full system access with all management capabilities",
    capabilities: [
      "Manage all users and assign roles",
      "Configure system settings and integrations",
      "Access all financial reports and analytics",
      "Manage rooms, menu items, and reservations",
      "Override any system restrictions",
      "Audit logs and security management",
    ],
  },
  manager: {
    title: "Manager",
    description: "Operational management with business oversight",
    capabilities: [
      "Manage rooms and availability",
      "Update menu items and pricing",
      "Handle complex reservations and guest issues",
      "Access POS system for oversight",
      "View financial reports and analytics",
      "Manage daily operations",
    ],
  },
  receptionist: {
    title: "Receptionist",
    description: "Front desk operations and guest services",
    capabilities: [
      "Create and manage hotel reservations",
      "Check guests in and out",
      "Update room status and availability",
      "Handle guest inquiries and requests",
      "Process room bookings and modifications",
      "Generate guest reports",
    ],
  },
  waiter: {
    title: "Waiter/Server",
    description: "Restaurant service and order management",
    capabilities: [
      "Take orders using POS system",
      "Process payments and bills",
      "Update menu item availability",
      "Manage table assignments",
      "Handle customer requests",
      "View daily sales reports",
    ],
  },
  kitchen: {
    title: "Kitchen Staff",
    description: "Food preparation and order fulfillment",
    capabilities: [
      "View incoming orders from POS",
      "Update order status (preparing, ready)",
      "Mark menu items as unavailable",
      "View kitchen reports and metrics",
      "Manage food inventory alerts",
      "Communicate with service staff",
    ],
  },
}

// Mock current user - replace with real authentication
export const getCurrentUser = (): User => {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      return {
        ...user,
        permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
      }
    }
  }

  // Fallback to default admin user
  return {
    id: "USR001",
    name: "John Kamau",
    email: "admin@mariahavens.com",
    role: "admin",
    status: "active",
    permissions: ROLE_PERMISSIONS.admin,
    lastLogin: "2024-01-15 09:30",
    createdAt: "2024-01-01",
  }
}

export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission)
}

export const canAccessRoute = (user: User, route: string): boolean => {
  const routePermissions: Record<string, Permission> = {
    "/dashboard/admin": "user_management",
    "/dashboard/reservations": "reservation_management",
    "/dashboard/pos": "pos_access",
    "/dashboard/reports": "reports_access",
    "/dashboard/settings": "settings_access",
    "/dashboard/rooms": "room_management",
    "/dashboard/menu": "menu_management",
    "/dashboard/financial": "financial_access",
  }

  const requiredPermission = routePermissions[route]
  return requiredPermission ? hasPermission(user, requiredPermission) : true
}
