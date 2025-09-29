"use client"

// @ts-nocheck
import { useState, useEffect, useCallback } from "react"
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
import { Users, Plus, Edit, Trash2, Search, Shield, Hotel, UtensilsCrossed, Settings, Eye, EyeOff, Loader2 } from "lucide-react"
import { getCurrentUser, hasPermission, ROLE_DESCRIPTIONS, Permission } from "@/lib/auth"
import { userAPI, hotelAPI, menuAPI, User as ApiUser, MenuItem as ApiMenuItem, MenuItemData } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

  // State for backend data
  const [users, setUsers] = useState<ApiUser[]>([])
  const [rooms, setRooms] = useState<any[]>([]) // Using any[] for now since Room interface is different from API type
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersResponse, roomsResponse, menuResponse] = await Promise.all([
        userAPI.getDashboardStats(),
        hotelAPI.getRooms(),
        menuAPI.getMenuItems()
      ]);

      const usersRes = usersResponse as { data?: { users?: ApiUser[] } };
      const roomsRes = roomsResponse as { data?: { results?: any[] } };
      const menuRes = menuResponse as { data?: { results?: ApiMenuItem[] } };

      if (usersRes.data) {
        setUsers(usersRes.data.users || []);
      }
      if (roomsRes.data) {
        setRooms(roomsRes.data.results || []);
      }
      if (menuRes.data) {
        setMenuItems(menuRes.data.results || []);
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || "Failed to load data");
      toast({
        title: "Error",
        description: err.message || "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [canManageUsers, canManageRooms, canManageMenu]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD handlers (examples - replace with actual API calls later)
  const handleAddUser = async (userData: any) => {
    setLoading(true)
    try {
      // await userAPI.createUser(userData)
      console.log("Mocking add user:", userData);
      toast({
        title: "Success",
        description: "User added successfully. (Mocked)",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false)
      setIsUserDialogOpen(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true)
    try {
      // await userAPI.deleteUser(userId)
      console.log("Mocking delete user:", userId);
      toast({
        title: "Success",
        description: "User deleted successfully. (Mocked)",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoom = async (roomData: any) => {
    setLoading(true)
    try {
      // await hotelAPI.createRoom(roomData)
      console.log("Mocking add room:", roomData);
      toast({
        title: "Success",
        description: "Room added successfully. (Mocked)",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false)
      setIsRoomDialogOpen(false)
    }
  }

  const handleAddMenuItem = async (itemData: MenuItemData) => {
    setLoading(true)
    try {
      // await menuAPI.createMenuItem(itemData)
      console.log("Mocking add menu item:", itemData);
      toast({
        title: "Success",
        description: "Menu item added successfully. (Mocked)",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false)
      setIsMenuDialogOpen(false)
    }
  }

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

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">You don&apos;t have permission to access the admin portal.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current role: {ROLE_DESCRIPTIONS[currentUser.role]?.title}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading admin data...</span>
      </div>
    );
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
          <span className="text-sm font-medium">{ROLE_DESCRIPTIONS[currentUser.role]?.title} Access</span>
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
                      <Button onClick={() => handleAddUser({})}>Create User</Button>
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
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>{ROLE_DESCRIPTIONS[user.role]?.title || user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.last_login}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(user.role !== "admin" || currentUser.role === "admin") && (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id as unknown as number)}>
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
                        <Button onClick={() => handleAddRoom({})}>Add Room</Button>
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
                        <TableCell>KSh {room.price?.toLocaleString() ?? room.price}</TableCell>
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
                        <DialogTitle>Add New Menu Item</DialogTitle>
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
                        <Button onClick={() => handleAddMenuItem({ name: "New Item", description: "A new description", price: 100, category: 1, is_available: true })}>Add Item</Button>
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
                        <TableCell>KSh {item.price?.toLocaleString() ?? item.price}</TableCell>
                        <TableCell>
                          <Badge className={item.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {item.is_available ? "Available" : "Unavailable"}
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