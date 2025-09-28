"use client"

// @ts-nocheck
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Edit, Trash2, Search, Shield, Hotel, UtensilsCrossed, Settings, Eye, EyeOff } from "lucide-react"
import { getCurrentUser, hasPermission, ROLE_DESCRIPTIONS } from "@/lib/auth"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "receptionist" | "waiter" | "kitchen"
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
}

interface Room {
  id: string
  number: string
  type: "standard" | "deluxe" | "family" | "presidential"
  status: "available" | "occupied" | "maintenance" | "cleaning"
  price: number
  maxGuests: number
  amenities: string[]
}

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  available: boolean
  ingredients: string[]
}

export function AdminPortal() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const currentUser = getCurrentUser()
  const canManageUsers = hasPermission(currentUser, "user_management")
  const canManageRooms = hasPermission(currentUser, "room_management")
  const canManageMenu = hasPermission(currentUser, "menu_management")

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">You don&apos;t have permission to access the admin portal.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current role: {ROLE_DESCRIPTIONS[currentUser.role].title}
          </p>
        </div>
      </div>
    )
  }

  // Mock data - you'll replace this with real data from your backend
  const users: User[] = [
    {
      id: "USR001",
      name: "John Kamau",
      email: "john.kamau@mariahavens.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15 09:30",
      createdAt: "2024-01-01",
    },
    {
      id: "USR002",
      name: "Sarah Wanjiku",
      email: "sarah.w@mariahavens.com",
      role: "manager",
      status: "active",
      lastLogin: "2024-01-15 08:45",
      createdAt: "2024-01-02",
    },
    {
      id: "USR003",
      name: "David Ochieng",
      email: "david.o@mariahavens.com",
      role: "receptionist",
      status: "active",
      lastLogin: "2024-01-14 17:20",
      createdAt: "2024-01-03",
    },
    {
      id: "USR004",
      name: "Grace Akinyi",
      email: "grace.a@mariahavens.com",
      role: "waiter",
      status: "inactive",
      lastLogin: "2024-01-10 14:15",
      createdAt: "2024-01-04",
    },
  ]

  const rooms: Room[] = [
    {
      id: "ROOM101",
      number: "101",
      type: "deluxe",
      status: "occupied",
      price: 7500,
      maxGuests: 2,
      amenities: ["AC", "WiFi", "TV", "Mini Bar", "Balcony"],
    },
    {
      id: "ROOM102",
      number: "102",
      type: "deluxe",
      status: "available",
      price: 7500,
      maxGuests: 2,
      amenities: ["AC", "WiFi", "TV", "Mini Bar", "Balcony"],
    },
    {
      id: "ROOM205",
      number: "205",
      type: "standard",
      status: "cleaning",
      price: 4000,
      maxGuests: 2,
      amenities: ["AC", "WiFi", "TV"],
    },
    {
      id: "ROOM301",
      number: "301",
      type: "family",
      status: "available",
      price: 6000,
      maxGuests: 4,
      amenities: ["AC", "WiFi", "TV", "Kitchenette"],
    },
  ]

  const menuItems: MenuItem[] = [
    {
      id: "MENU001",
      name: "Nyama Choma",
      category: "main",
      price: 800,
      description: "Grilled beef with traditional spices",
      available: true,
      ingredients: ["Beef", "Spices", "Salt"],
    },
    {
      id: "MENU002",
      name: "Fish Curry",
      category: "main",
      price: 650,
      description: "Fresh fish in coconut curry sauce",
      available: true,
      ingredients: ["Fish", "Coconut Milk", "Curry Spices", "Onions"],
    },
    {
      id: "MENU003",
      name: "Vegetable Samosas",
      category: "appetizers",
      price: 300,
      description: "Crispy pastries with vegetable filling",
      available: false,
      ingredients: ["Pastry", "Mixed Vegetables", "Spices"],
    },
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "receptionist":
        return "bg-green-100 text-green-800"
      case "waiter":
        return "bg-yellow-100 text-yellow-800"
      case "kitchen":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "available":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "maintenance":
        return "bg-red-100 text-red-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "cleaning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoomTypeDisplay = (type: string) => {
    switch (type) {
      case "standard":
        return "Standard Room"
      case "deluxe":
        return "Deluxe Suite"
      case "family":
        return "Family Room"
      case "presidential":
        return "Presidential Suite"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground">Manage users, rooms, and menu items</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{ROLE_DESCRIPTIONS[currentUser.role].title} Access</span>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          {canManageRooms && (
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Room Management
            </TabsTrigger>
          )}
          {canManageMenu && (
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu Management
            </TabsTrigger>
          )}
        </TabsList>

        {/* User Management - Always visible for admin portal access */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage staff accounts and permissions</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new staff account with appropriate permissions</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Full Name</Label>
                        <Input id="user-name" placeholder="Enter full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Email</Label>
                        <Input id="user-email" type="email" placeholder="user@mariahavens.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="user-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-role">Role</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div>
                                <p className="font-medium">Administrator</p>
                                <p className="text-xs text-muted-foreground">Full system access</p>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div>
                                <p className="font-medium">Manager</p>
                                <p className="text-xs text-muted-foreground">Operational management</p>
                              </div>
                            </SelectItem>
                            <SelectItem value="receptionist">
                              <div>
                                <p className="font-medium">Receptionist</p>
                                <p className="text-xs text-muted-foreground">Front desk operations</p>
                              </div>
                            </SelectItem>
                            <SelectItem value="waiter">
                              <div>
                                <p className="font-medium">Waiter</p>
                                <p className="text-xs text-muted-foreground">Restaurant service</p>
                              </div>
                            </SelectItem>
                            <SelectItem value="kitchen">
                              <div>
                                <p className="font-medium">Kitchen Staff</p>
                                <p className="text-xs text-muted-foreground">Food preparation</p>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsUserDialogOpen(false)}>Create User</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-sm"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>{ROLE_DESCRIPTIONS[user.role].title}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(user.role !== "admin" || currentUser.role === "admin") && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageRooms && (
          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Room Management</CardTitle>
                    <CardDescription>Manage hotel rooms and availability</CardDescription>
                  </div>
                  <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Room</DialogTitle>
                        <DialogDescription>Add a new room to the hotel inventory</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="room-number">Room Number</Label>
                          <Input id="room-number" placeholder="e.g., 101" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="room-type">Room Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard Room</SelectItem>
                              <SelectItem value="deluxe">Deluxe Suite</SelectItem>
                              <SelectItem value="family">Family Room</SelectItem>
                              <SelectItem value="presidential">Presidential Suite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="room-price">Price per Night (KSh)</Label>
                          <Input id="room-price" type="number" placeholder="4000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-guests">Maximum Guests</Label>
                          <Input id="max-guests" type="number" placeholder="2" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amenities">Amenities</Label>
                          <Textarea id="amenities" placeholder="AC, WiFi, TV, Mini Bar..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsRoomDialogOpen(false)}>Add Room</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Max Guests</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.number}</TableCell>
                        <TableCell>{getRoomTypeDisplay(room.type)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                        </TableCell>
                        <TableCell>KSh {room.price.toLocaleString()}</TableCell>
                        <TableCell>{room.maxGuests}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canManageMenu && (
          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>Manage restaurant menu items and pricing</CardDescription>
                  </div>
                  <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Menu Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Menu Item</DialogTitle>
                        <DialogDescription>Add a new item to the restaurant menu</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-name">Item Name</Label>
                          <Input id="item-name" placeholder="e.g., Nyama Choma" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-category">Category</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="appetizers">Appetizers</SelectItem>
                              <SelectItem value="main">Main Courses</SelectItem>
                              <SelectItem value="sides">Sides</SelectItem>
                              <SelectItem value="vegetables">Vegetables</SelectItem>
                              <SelectItem value="beverages">Beverages</SelectItem>
                              <SelectItem value="desserts">Desserts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-price">Price (KSh)</Label>
                          <Input id="item-price" type="number" placeholder="800" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-description">Description</Label>
                          <Textarea id="item-description" placeholder="Describe the dish..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-ingredients">Ingredients</Label>
                          <Textarea id="item-ingredients" placeholder="List main ingredients..." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="item-available" />
                          <Label htmlFor="item-available">Available</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsMenuDialogOpen(false)}>Add Item</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell>KSh {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
