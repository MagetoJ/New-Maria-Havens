"use client"

// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  DollarSign,
  Hotel,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  ChefHat,
  Bed,
  Settings,
} from "lucide-react"
import { getCurrentUser, hasPermission, ROLE_DESCRIPTIONS, Permission } from "@/lib/auth"

export function DashboardOverview() {
  const currentUser = getCurrentUser()

  // Mock data - you'll replace this with real data from your backend
  const stats = [
    {
      title: "Total Revenue",
      value: "KSh 45,231",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up",
      permission: "financial_access",
    },
    {
      title: "Occupancy Rate",
      value: "78%",
      change: "+12%",
      icon: Hotel,
      trend: "up",
      permission: "room_management",
    },
    {
      title: "Active Reservations",
      value: "24",
      change: "+3",
      icon: Calendar,
      trend: "up",
      permission: "reservation_management",
    },
    {
      title: "Restaurant Orders",
      value: "156",
      change: "+8.2%",
      icon: UtensilsCrossed,
      trend: "up",
      permission: "pos_access",
    },
  ]

  const visibleStats = stats.filter((stat) => !stat.permission || hasPermission(currentUser, stat.permission as Permission))

  const recentReservations = [
    { id: 1, guest: "John Kamau", room: "Deluxe Suite 101", checkIn: "2024-01-15", status: "confirmed" },
    { id: 2, guest: "Sarah Wanjiku", room: "Standard Room 205", checkIn: "2024-01-15", status: "pending" },
    { id: 3, guest: "David Ochieng", room: "Family Room 301", checkIn: "2024-01-16", status: "confirmed" },
    { id: 4, guest: "Grace Akinyi", room: "Deluxe Suite 102", checkIn: "2024-01-16", status: "confirmed" },
  ]

  const recentOrders = [
    { id: 1, table: "Table 5", items: "Nyama Choma, Ugali, Sukuma Wiki", total: "KSh 1,200", status: "preparing" },
    { id: 2, table: "Table 12", items: "Fish Curry, Rice, Chapati", total: "KSh 950", status: "ready" },
    { id: 3, table: "Table 3", items: "Chicken Tikka, Naan, Salad", total: "KSh 1,100", status: "served" },
    { id: 4, table: "Table 8", items: "Vegetable Samosas, Tea", total: "KSh 400", status: "preparing" },
  ]

  const getQuickActions = () => {
    const actions = []

    if (hasPermission(currentUser, "reservation_management")) {
      actions.push({
        icon: Calendar,
        label: "New Reservation",
        href: "/dashboard/reservations",
        variant: "default" as const,
      })
    }

    if (hasPermission(currentUser, "pos_access")) {
      actions.push({
        icon: UtensilsCrossed,
        label: currentUser.role === "kitchen" ? "View Orders" : "Take Order",
        href: "/dashboard/pos",
        variant: "outline" as const,
      })
    }

    if (hasPermission(currentUser, "room_management")) {
      actions.push({
        icon: Users,
        label: "Check-in Guest",
        href: "/dashboard/reservations",
        variant: "outline" as const,
      })
    }

    if (hasPermission(currentUser, "reports_access")) {
      actions.push({
        icon: TrendingUp,
        label: "View Reports",
        href: "/dashboard/reports",
        variant: "outline" as const,
      })
    }

    if (hasPermission(currentUser, "user_management")) {
      actions.push({
        icon: Settings,
        label: "Admin Portal",
        href: "/dashboard/admin",
        variant: "outline" as const,
      })
    }

    return actions
  }

  const getWelcomeMessage = () => {
    const roleDesc = ROLE_DESCRIPTIONS[currentUser.role]
    return `Welcome back, ${currentUser.name}! You're logged in as ${roleDesc.title}.`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">{getWelcomeMessage()}</p>
      </div>

      {visibleStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span> from
                  last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {hasPermission(currentUser, "reservation_management") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Reservations
              </CardTitle>
              <CardDescription>Latest hotel bookings and check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{reservation.guest}</p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.room} • Check-in: {reservation.checkIn}
                      </p>
                    </div>
                    <Badge
                      variant={reservation.status === "confirmed" ? "default" : "secondary"}
                      className={reservation.status === "confirmed" ? "bg-green-100 text-green-800" : ""}
                    >
                      {reservation.status === "confirmed" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {reservation.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View All Reservations
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission(currentUser, "pos_access") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentUser.role === "kitchen" ? (
                  <ChefHat className="h-5 w-5" />
                ) : (
                  <UtensilsCrossed className="h-5 w-5" />
                )}
                {currentUser.role === "kitchen" ? "Kitchen Orders" : "Restaurant Orders"}
              </CardTitle>
              <CardDescription>
                {currentUser.role === "kitchen" ? "Orders to prepare" : "Current orders and kitchen status"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders
                  .filter((order) => currentUser.role !== "kitchen" || order.status === "preparing")
                  .map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.table}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items} {currentUser.role !== "kitchen" && `• ${order.total}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status === "served" ? "default" : order.status === "ready" ? "secondary" : "outline"
                        }
                        className={
                          order.status === "served"
                            ? "bg-green-100 text-green-800"
                            : order.status === "ready"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                        }
                      >
                        {order.status === "served" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : order.status === "ready" ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {order.status}
                      </Badge>
                    </div>
                  ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                {currentUser.role === "kitchen" ? "View Kitchen Orders" : "View All Orders"}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentUser.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>System health and admin alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Database Connection</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Payment Gateway</p>
                    <p className="text-xs text-muted-foreground">M-Pesa & Card processing</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Last Backup</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 03:00 AM</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View System Logs
              </Button>
            </CardContent>
          </Card>
        )}

        {currentUser.role === "receptionist" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                Room Status
              </CardTitle>
              <CardDescription>Current room availability and housekeeping</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Available Rooms</p>
                    <p className="text-xs text-muted-foreground">Ready for check-in</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Occupied Rooms</p>
                    <p className="text-xs text-muted-foreground">Current guests</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">18</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cleaning Required</p>
                    <p className="text-xs text-muted-foreground">Housekeeping needed</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">3</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View Room Management
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {getQuickActions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {currentUser.role === "kitchen" ? "Kitchen operations" : "Common tasks and shortcuts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {getQuickActions().map((action, index) => (
                <Button key={index} variant={action.variant} className="h-20 flex-col gap-2">
                  <action.icon className="h-6 w-6" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Role & Capabilities</CardTitle>
          <CardDescription>What you can do with your current access level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary">{ROLE_DESCRIPTIONS[currentUser.role].title}</Badge>
              <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[currentUser.role].description}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {ROLE_DESCRIPTIONS[currentUser.role].capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {capability}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
