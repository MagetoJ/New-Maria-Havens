"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
} from "lucide-react"

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description: string
  available: boolean
  image?: string
}

interface OrderItem extends MenuItem {
  quantity: number
  notes?: string
}

interface Order {
  id: string
  table: string
  items: OrderItem[]
  status: "pending" | "preparing" | "ready" | "served"
  total: number
  timestamp: string
  customerName?: string
}

export function RestaurantPOS() {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedTable, setSelectedTable] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

  // Mock menu data - you'll replace this with real data from your backend
  const menuItems: MenuItem[] = [
    {
      id: "nyama-choma",
      name: "Nyama Choma",
      price: 800,
      category: "main",
      description: "Grilled beef with traditional spices",
      available: true,
    },
    {
      id: "ugali",
      name: "Ugali",
      price: 150,
      category: "sides",
      description: "Traditional cornmeal staple",
      available: true,
    },
    {
      id: "sukuma-wiki",
      name: "Sukuma Wiki",
      price: 200,
      category: "vegetables",
      description: "Sautéed collard greens",
      available: true,
    },
    {
      id: "fish-curry",
      name: "Fish Curry",
      price: 650,
      category: "main",
      description: "Fresh fish in coconut curry sauce",
      available: true,
    },
    {
      id: "chapati",
      name: "Chapati",
      price: 50,
      category: "sides",
      description: "Soft flatbread",
      available: true,
    },
    {
      id: "chicken-tikka",
      name: "Chicken Tikka",
      price: 750,
      category: "main",
      description: "Marinated grilled chicken pieces",
      available: true,
    },
    {
      id: "samosas",
      name: "Vegetable Samosas",
      price: 300,
      category: "appetizers",
      description: "Crispy pastries with vegetable filling",
      available: true,
    },
    {
      id: "tea",
      name: "Kenyan Tea",
      price: 100,
      category: "beverages",
      description: "Traditional spiced tea",
      available: true,
    },
    {
      id: "soda",
      name: "Soft Drinks",
      price: 120,
      category: "beverages",
      description: "Assorted sodas",
      available: true,
    },
  ]

  // Mock active orders - you'll replace this with real data from your backend
  const activeOrders: Order[] = [
    {
      id: "ORD001",
      table: "Table 5",
      items: [
        { ...menuItems[0], quantity: 2 },
        { ...menuItems[1], quantity: 2 },
        { ...menuItems[2], quantity: 1 },
      ],
      status: "preparing",
      total: 1950,
      timestamp: "14:30",
      customerName: "John Doe",
    },
    {
      id: "ORD002",
      table: "Table 12",
      items: [
        { ...menuItems[3], quantity: 1 },
        { ...menuItems[4], quantity: 2 },
      ],
      status: "ready",
      total: 750,
      timestamp: "14:45",
      customerName: "Sarah Kim",
    },
  ]

  const categories = [
    { id: "all", name: "All Items" },
    { id: "appetizers", name: "Appetizers" },
    { id: "main", name: "Main Courses" },
    { id: "sides", name: "Sides" },
    { id: "vegetables", name: "Vegetables" },
    { id: "beverages", name: "Beverages" },
  ]

  const tables = Array.from({ length: 20 }, (_, i) => `Table ${i + 1}`)

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory && item.available
  })

  const addToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find((orderItem) => orderItem.id === item.id)
    if (existingItem) {
      setCurrentOrder(
        currentOrder.map((orderItem) =>
          orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem,
        ),
      )
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }])
    }
  }

  const removeFromOrder = (itemId: string) => {
    const existingItem = currentOrder.find((orderItem) => orderItem.id === itemId)
    if (existingItem && existingItem.quantity > 1) {
      setCurrentOrder(
        currentOrder.map((orderItem) =>
          orderItem.id === itemId ? { ...orderItem, quantity: orderItem.quantity - 1 } : orderItem,
        ),
      )
    } else {
      setCurrentOrder(currentOrder.filter((orderItem) => orderItem.id !== itemId))
    }
  }

  const clearOrder = () => {
    setCurrentOrder([])
    setSelectedTable("")
    setCustomerName("")
  }

  const calculateTotal = () => {
    return currentOrder.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const submitOrder = () => {
    // Here you would submit the order to your backend
    console.log("Submitting order:", {
      table: selectedTable,
      customerName,
      items: currentOrder,
      total: calculateTotal(),
    })
    clearOrder()
    setIsOrderDialogOpen(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparing":
        return <Clock className="h-4 w-4" />
      case "ready":
        return <AlertCircle className="h-4 w-4" />
      case "served":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "served":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Restaurant POS</h1>
          <p className="text-muted-foreground">Take orders and manage kitchen operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Menu Items</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search menu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="text-lg font-bold text-primary">KSh {item.price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <Button onClick={() => addToOrder(item)} className="w-full" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Order
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Order */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrder.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {currentOrder.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">KSh {item.price.toLocaleString()} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => removeFromOrder(item.id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button variant="outline" size="sm" onClick={() => addToOrder(item)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">KSh {calculateTotal().toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="table-select">Table</Label>
                      <Select value={selectedTable} onValueChange={setSelectedTable}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table} value={table}>
                              {table}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearOrder} className="flex-1 bg-transparent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex-1" disabled={currentOrder.length === 0 || !selectedTable}>
                            Submit Order
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Order</DialogTitle>
                            <DialogDescription>Please review the order details before submitting</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p>
                                <strong>Table:</strong> {selectedTable}
                              </p>
                              {customerName && (
                                <p>
                                  <strong>Customer:</strong> {customerName}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium">Order Items:</h4>
                              {currentOrder.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>KSh {calculateTotal().toLocaleString()}</span>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={submitOrder}>Confirm Order</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
          <CardDescription>Current orders in the kitchen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{order.table}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} • {order.timestamp}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="mb-3" />

                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">KSh {order.total.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "preparing" && (
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        Mark Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" className="flex-1">
                        Mark Served
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
