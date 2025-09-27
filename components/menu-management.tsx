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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ChefHat, Plus, Edit, Trash2, Search, DollarSign, Clock, TrendingUp } from "lucide-react"
import { getCurrentUser, hasPermission } from "@/lib/auth"

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  available: boolean
  ingredients: string[]
  preparationTime: number
  popularity: number
}

export function MenuManagement() {
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const currentUser = getCurrentUser()
  const canManageMenu = hasPermission(currentUser, "menu_management")

  const menuItems: MenuItem[] = [
    {
      id: "MENU001",
      name: "Nyama Choma",
      category: "main",
      price: 800,
      description: "Grilled beef with traditional spices",
      available: true,
      ingredients: ["Beef", "Spices", "Salt"],
      preparationTime: 25,
      popularity: 95,
    },
    {
      id: "MENU002",
      name: "Fish Curry",
      category: "main",
      price: 650,
      description: "Fresh fish in coconut curry sauce",
      available: true,
      ingredients: ["Fish", "Coconut Milk", "Curry Spices", "Onions"],
      preparationTime: 20,
      popularity: 87,
    },
    {
      id: "MENU003",
      name: "Vegetable Samosas",
      category: "appetizers",
      price: 300,
      description: "Crispy pastries with vegetable filling",
      available: false,
      ingredients: ["Pastry", "Mixed Vegetables", "Spices"],
      preparationTime: 15,
      popularity: 78,
    },
    {
      id: "MENU004",
      name: "Ugali",
      category: "sides",
      price: 150,
      description: "Traditional cornmeal staple",
      available: true,
      ingredients: ["Cornmeal", "Water", "Salt"],
      preparationTime: 10,
      popularity: 92,
    },
    {
      id: "MENU005",
      name: "Tusker Beer",
      category: "beverages",
      price: 250,
      description: "Local Kenyan beer",
      available: true,
      ingredients: ["Hops", "Barley", "Water"],
      preparationTime: 2,
      popularity: 85,
    },
  ]

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "appetizers", label: "Appetizers" },
    { value: "main", label: "Main Courses" },
    { value: "sides", label: "Sides" },
    { value: "vegetables", label: "Vegetables" },
    { value: "beverages", label: "Beverages" },
    { value: "desserts", label: "Desserts" },
  ]

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const availableItems = menuItems.filter((item) => item.available).length
  const totalItems = menuItems.length
  const avgPrice = Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground">Manage restaurant menu items, pricing, and availability</p>
        </div>
        {canManageMenu && (
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
                  <Label htmlFor="prep-time">Preparation Time (minutes)</Label>
                  <Input id="prep-time" type="number" placeholder="20" />
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
        )}
      </div>

      {/* Menu Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ChefHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Menu items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Badge className="bg-green-100 text-green-800 text-xs">{availableItems}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableItems}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {avgPrice}</div>
            <p className="text-xs text-muted-foreground">Per item</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <p className="text-xs text-muted-foreground">Menu categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Manage menu items, pricing, and availability</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Prep Time</TableHead>
                <TableHead>Popularity</TableHead>
                <TableHead>Status</TableHead>
                {canManageMenu && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      KSh {item.price.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.preparationTime}m
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {item.popularity}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  {canManageMenu && (
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
