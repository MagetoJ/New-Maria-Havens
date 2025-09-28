"use client"

// @ts-nocheck
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
import { Bed, Plus, Edit, Settings, Search, Calendar, Users, DollarSign, Wifi, Tv, Coffee } from "lucide-react"
import { getCurrentUser, hasPermission } from "@/lib/auth"

interface Room {
  id: string
  number: string
  type: "standard" | "deluxe" | "family" | "presidential"
  status: "available" | "occupied" | "maintenance" | "cleaning"
  price: number
  maxGuests: number
  amenities: string[]
  currentGuest?: string
  checkIn?: string
  checkOut?: string
}

export function RoomManagement() {
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const currentUser = getCurrentUser()
  const canManageRooms = hasPermission(currentUser, "room_management")

  const rooms: Room[] = [
    {
      id: "ROOM101",
      number: "101",
      type: "deluxe",
      status: "occupied",
      price: 7500,
      maxGuests: 2,
      amenities: ["AC", "WiFi", "TV", "Mini Bar", "Balcony"],
      currentGuest: "Sarah Johnson",
      checkIn: "2024-01-14",
      checkOut: "2024-01-16",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-red-100 text-red-800"
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "tv":
        return <Tv className="h-4 w-4" />
      case "ac":
        return <Coffee className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const availableRooms = rooms.filter((room) => room.status === "available").length
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length
  const maintenanceRooms = rooms.filter((room) => room.status === "maintenance").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">Manage hotel rooms, availability, and guest assignments</p>
        </div>
        {canManageRooms && (
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
        )}
      </div>

      {/* Room Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <Bed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableRooms}</div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{occupiedRooms}</div>
            <p className="text-xs text-muted-foreground">Currently checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Settings className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{maintenanceRooms}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round((occupiedRooms / rooms.length) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Current occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Room Inventory</CardTitle>
              <CardDescription>Manage room status, pricing, and guest assignments</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Guest</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Amenities</TableHead>
                {canManageRooms && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      Room {room.number}
                    </div>
                  </TableCell>
                  <TableCell>{getRoomTypeDisplay(room.type)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {room.currentGuest ? (
                      <div>
                        <p className="font-medium">{room.currentGuest}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.checkIn} - {room.checkOut}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      KSh {room.price.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          {getAmenityIcon(amenity)}
                        </div>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{room.amenities.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  {canManageRooms && (
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
