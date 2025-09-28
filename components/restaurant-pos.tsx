// @ts-nocheck
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  Loader2,
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { Receipt } from "./receipt"
import { menuAPI, ordersAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// Updated interfaces to match backend models
interface MenuItem {
  id: number
  name: string
  price: string // Backend sends as string, we'll convert to number when needed
  category: {
    id: number
    name: string
  }
  description: string
  availability_status: 'available' | 'unavailable' | 'out_of_stock'
  prep_time: number
  image?: string
}

interface Category {
  id: number
  name: string
  description?: string
}

interface Table {
  id: number
  number: string
  capacity: number
  section: string
  is_active: boolean
  is_occupied: boolean
}

export interface OrderItem extends MenuItem {
  quantity: number
  notes?: string
}

export interface Order {
  id?: number
  table: number
  items: OrderItem[]
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
  total_amount?: string
  subtotal?: string
  tax?: string
  discount?: string
  order_type: "dine_in" | "takeaway" | "delivery"
  customer_name?: string
  customer_phone?: string
  special_instructions?: string
  created_at?: string
  order_number?: string
}

export function RestaurantPOS() {
  // State for current order being built
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedTable, setSelectedTable] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in")
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // Dialog states
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null)
  
  // Data from backend
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  
  const componentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const [menuResponse, categoriesResponse, tablesResponse] = await Promise.all([
        menuAPI.getMenuItems(),
        menuAPI.getCategories(),
        ordersAPI.getTables(),
      ])
      
      setMenuItems(menuResponse.data)
      setCategories(categoriesResponse.data)
      setTables(tablesResponse.data)
      
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast({
        title: "Error",
        description: "Failed to load initial data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchActiveOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true)
      const response = await ordersAPI.getOrders({ 
        status: 'pending,confirmed,preparing,ready' 
      })
      setActiveOrders(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Failed to load active orders.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingOrders(false)
    }
  }, [toast])

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData()
    fetchActiveOrders()
  }, [fetchInitialData, fetchActiveOrders])

  // Filter menu items based on search and category
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           item.category.name.toLowerCase() === selectedCategory.toLowerCase()
    const isAvailable = item.availability_status === 'available'
    
    return matchesSearch && matchesCategory && isAvailable
  })

  const addToOrder = (menuItem: MenuItem) => {
    setCurrentOrder((prev) => {
      const existingItem = prev.find((item) => item.id === menuItem.id)
      if (existingItem) {
        return prev.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { ...menuItem, quantity: 1 }]
      }
    })
  }

  const removeFromOrder = (itemId: number) => {
    setCurrentOrder((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId)
      return
    }
    
    setCurrentOrder((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const _updateItemNotes = (itemId: number, notes: string) => {
    setCurrentOrder((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    )
  }

  const calculateOrderTotal = () => {
    return currentOrder.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity)
    }, 0)
  }

  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the order first.",
        variant: "destructive",
      })
      return
    }

    if (orderType === "dine_in" && !selectedTable) {
      toast({
        title: "Error", 
        description: "Please select a table for dine-in orders.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmittingOrder(true)
      
      // Create the order
      const orderData = {
        table: orderType === "dine_in" ? parseInt(selectedTable) : null,
        order_type: orderType,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        special_instructions: specialInstructions || undefined,
        status: "pending"
      }
      
      const orderResponse = await ordersAPI.createOrder(orderData)
      const createdOrder = orderResponse.data
      
      // Add items to the order
      for (const item of currentOrder) {
        await ordersAPI.addOrderItem({
          order: createdOrder.id,
          menu_item: item.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          special_instructions: item.notes || undefined
        })
      }
      
      // Update the order total by fetching it again
      const updatedOrderResponse = await ordersAPI.getOrder(createdOrder.id)
      const finalOrder = updatedOrderResponse.data
      
      setSubmittedOrder({
        ...finalOrder,
        items: currentOrder
      })
      
      // Clear current order
      setCurrentOrder([])
      setCustomerName("")
      setCustomerPhone("")
      setSpecialInstructions("")
      setSelectedTable("")
      
      // Refresh active orders
      fetchActiveOrders()
      
      toast({
        title: "Success",
        description: `Order ${finalOrder.order_number} has been submitted successfully!`,
      })
      
    } catch (error) {
      console.error('Error submitting order:', error)
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingOrder(false)
      setIsOrderDialogOpen(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      switch (newStatus) {
        case 'confirmed':
          await ordersAPI.confirmOrder(orderId)
          break
        case 'served':
          await ordersAPI.serveOrder(orderId)
          break
        case 'completed':
          await ordersAPI.completeOrder(orderId)
          break
        case 'cancelled':
          await ordersAPI.cancelOrder(orderId)
          break
        default:
          await ordersAPI.updateOrder(orderId, { status: newStatus })
      }
      
      // Refresh active orders
      fetchActiveOrders()
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
      
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "confirmed":
        return "default"
      case "preparing":
        return "destructive"
      case "ready":
        return "default"
      case "served":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
      case "ready":
        return <CheckCircle className="h-4 w-4" />
      case "preparing":
        return <UtensilsCrossed className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const _handlePrint = useReactToPrint({
    content: () => componentRef.current,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading POS system...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Menu Items */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Restaurant POS</h1>
          
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToOrder(item)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">${parseFloat(item.price).toFixed(2)}</p>
                      <Badge variant="outline">{item.category.name}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.prep_time} min
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right side - Current Order and Active Orders */}
      <div className="w-96 border-l bg-white p-6">
        <div className="space-y-6">
          {/* Current Order */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {currentOrder.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            ${parseFloat(item.price).toFixed(2)} each
                          </p>
                          {item.notes && (
                            <p className="text-xs text-blue-600">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromOrder(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>${calculateOrderTotal().toFixed(2)}</span>
                  </div>
                  
                  <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4" size="lg">
                        Submit Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                          Please provide order details before submitting.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="orderType">Order Type</Label>
                          <Select value={orderType} onValueChange={(value: string) => setOrderType(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dine_in">Dine In</SelectItem>
                              <SelectItem value="takeaway">Takeaway</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {orderType === "dine_in" && (
                          <div>
                            <Label htmlFor="table">Table</Label>
                            <Select value={selectedTable} onValueChange={setSelectedTable}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select table" />
                              </SelectTrigger>
                              <SelectContent>
                                {tables.filter(table => table.is_active && !table.is_occupied).map((table) => (
                                  <SelectItem key={table.id} value={table.id.toString()}>
                                    Table {table.number} ({table.capacity} seats - {table.section})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="customerName">Customer Name (Optional)</Label>
                          <Input
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter customer name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                          <Input
                            id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div>
                          <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                          <Input
                            id="specialInstructions"
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests..."
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsOrderDialogOpen(false)}
                          disabled={isSubmittingOrder}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={submitOrder} 
                          disabled={isSubmittingOrder}
                        >
                          {isSubmittingOrder ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            `Submit Order - $${calculateOrderTotal().toFixed(2)}`
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Orders</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchActiveOrders}
                  disabled={isLoadingOrders}
                >
                  {isLoadingOrders ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {activeOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active orders</p>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <Card key={order.id} className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              {order.order_type === 'dine_in' ? `Table ${order.table}` : order.order_type}
                            </p>
                            {order.customer_name && (
                              <p className="text-sm text-gray-600">{order.customer_name}</p>
                            )}
                          </div>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-bold">
                            ${parseFloat(order.total_amount || '0').toFixed(2)}
                          </span>
                          <div className="flex gap-1">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id!, 'confirmed')}
                              >
                                Confirm
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id!, 'preparing')}
                              >
                                Start
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id!, 'ready')}
                              >
                                Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id!, 'served')}
                              >
                                Serve
                              </Button>
                            )}
                            {(order.status === 'served' || order.status === 'ready') && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id!, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id!, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt - hidden but used for printing */}
      {submittedOrder && (
        <div style={{ display: 'none' }}>
          <div ref={componentRef}>
            <Receipt order={submittedOrder} />
          </div>
        </div>
      )}
    </div>
  )
}