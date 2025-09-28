// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
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
import { menuAPI } from "@/lib/api"

interface Category {
  id: number
  name: string
  description: string
  is_active: boolean
  items_count?: number
}

interface MenuItem {
  id: number
  name: string
  category: number
  category_name?: string
  price: string
  description: string
  availability_status: string
  prep_time: number
  calories?: number
  is_featured: boolean
  stock_quantity: number
}

export function MenuManagement() {
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state for new menu item
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparation_time: '',
    ingredients: '',
    availability_status: 'available'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const currentUser = getCurrentUser()
  const canManageMenu = hasPermission(currentUser, "menu_management")

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [categoriesResponse, itemsResponse] = await Promise.all([
          menuAPI.getCategories(),
          menuAPI.getMenuItems()
        ])
        
        setCategories(categoriesResponse.results || categoriesResponse)
        setMenuItems(itemsResponse.results || itemsResponse)
      } catch (err) {
        console.error('Error fetching menu data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load menu data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const availableItems = menuItems.filter((item) => item.availability_status === 'available').length
  const totalItems = menuItems.length
  const avgPrice = totalItems > 0 ? Math.round(menuItems.reduce((sum, item) => sum + parseFloat(item.price), 0) / totalItems) : 0

  // Create category options for dropdown
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
  ]

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setNewItem(prev => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: '',
      preparation_time: '',
      ingredients: '',
      availability_status: 'available'
    })
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const itemData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: parseInt(newItem.category),
        prep_time: parseInt(newItem.preparation_time) || 0,
        ingredients: newItem.ingredients,
        availability_status: newItem.availability_status,
        is_available: newItem.availability_status === 'available'
      }
      
      await menuAPI.createMenuItem(itemData)
      
      // Refresh menu items
      const menuResponse = await menuAPI.getMenuItems()
      setMenuItems(menuResponse.results || menuResponse)
      
      // Close dialog and reset form
      setIsMenuDialogOpen(false)
      resetForm()
      setError(null)
    } catch (error) {
      console.error('Error creating menu item:', error)
      setError('Failed to create menu item. Please try again.')
    }
    setIsSubmitting(false)
  }

  // Handle edit menu item
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category.toString(),
      preparation_time: item.prep_time.toString(),
      ingredients: item.ingredients || '',
      availability_status: item.availability_status
    })
    setIsEditDialogOpen(true)
  }

  // Handle update menu item
  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.name || !newItem.price || !newItem.category) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const itemData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: parseInt(newItem.category),
        prep_time: parseInt(newItem.preparation_time) || 0,
        ingredients: newItem.ingredients,
        availability_status: newItem.availability_status,
        is_available: newItem.availability_status === 'available'
      }
      
      await menuAPI.updateMenuItem(editingItem.id, itemData)
      
      // Refresh menu items
      const menuResponse = await menuAPI.getMenuItems()
      setMenuItems(menuResponse.results || menuResponse)
      
      // Close dialog and reset form
      setIsEditDialogOpen(false)
      setEditingItem(null)
      resetForm()
      setError(null)
    } catch (error) {
      console.error('Error updating menu item:', error)
      setError('Failed to update menu item. Please try again.')
    }
    setIsSubmitting(false)
  }

  // Handle delete menu item
  const handleDeleteItem = async (id: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await menuAPI.deleteMenuItem(id)
        
        // Refresh menu items
        const menuResponse = await menuAPI.getMenuItems()
        setMenuItems(menuResponse.results || menuResponse)
      } catch (error) {
        console.error('Error deleting menu item:', error)
        setError('Failed to delete menu item. Please try again.')
      }
    }
  }

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
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input 
                    id="item-name" 
                    placeholder="e.g., Nyama Choma" 
                    value={newItem.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category *</Label>
                  <Select value={newItem.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.id !== 0).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price (KSh) *</Label>
                  <Input 
                    id="item-price" 
                    type="number" 
                    placeholder="800" 
                    value={newItem.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep-time">Preparation Time (minutes)</Label>
                  <Input 
                    id="prep-time" 
                    type="number" 
                    placeholder="20" 
                    value={newItem.preparation_time}
                    onChange={(e) => handleInputChange('preparation_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea 
                    id="item-description" 
                    placeholder="Describe the dish..." 
                    value={newItem.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-ingredients">Ingredients</Label>
                  <Textarea 
                    id="item-ingredients" 
                    placeholder="List main ingredients..." 
                    value={newItem.ingredients}
                    onChange={(e) => handleInputChange('ingredients', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="item-available" 
                    checked={newItem.availability_status === 'available'}
                    onCheckedChange={(checked) => 
                      handleInputChange('availability_status', checked ? 'available' : 'unavailable')
                    }
                  />
                  <Label htmlFor="item-available">Available</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsMenuDialogOpen(false)
                  resetForm()
                  setError(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Menu Item Dialog */}
        {canManageMenu && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>Update the menu item details</DialogDescription>
              </DialogHeader>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Item Name *</Label>
                  <Input 
                    id="edit-item-name" 
                    placeholder="e.g., Nyama Choma" 
                    value={newItem.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-category">Category *</Label>
                  <Select value={newItem.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.id !== 0).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-price">Price (KSh) *</Label>
                  <Input 
                    id="edit-item-price" 
                    type="number" 
                    placeholder="800" 
                    value={newItem.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prep-time">Preparation Time (minutes)</Label>
                  <Input 
                    id="edit-prep-time" 
                    type="number" 
                    placeholder="20" 
                    value={newItem.preparation_time}
                    onChange={(e) => handleInputChange('preparation_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-description">Description</Label>
                  <Textarea 
                    id="edit-item-description" 
                    placeholder="Describe the dish..." 
                    value={newItem.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-ingredients">Ingredients</Label>
                  <Textarea 
                    id="edit-item-ingredients" 
                    placeholder="List main ingredients..." 
                    value={newItem.ingredients}
                    onChange={(e) => handleInputChange('ingredients', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-item-available" 
                    checked={newItem.availability_status === 'available'}
                    onCheckedChange={(checked) => 
                      handleInputChange('availability_status', checked ? 'available' : 'unavailable')
                    }
                  />
                  <Label htmlFor="edit-item-available">Available</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingItem(null)
                  resetForm()
                  setError(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Item'}
                </Button>
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
            <div className="text-2xl font-bold">{categories.filter(cat => cat.id !== 0).length}</div>
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
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  <TableCell className="capitalize">
                    {categories.find(cat => cat.id === item.category)?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      KSh {parseFloat(item.price).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.prep_time}m
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {item.popularity || 0}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.availability_status === 'available' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.availability_status === 'available' ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  {canManageMenu && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
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
