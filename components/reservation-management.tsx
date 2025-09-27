"use client"

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
import { Calendar, Plus, Search, Filter, Eye, Edit, CheckCircle, Clock, XCircle, Phone, Mail } from "lucide-react"

export function ReservationManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)

  // Mock data - you'll replace this with real data from your backend
  const reservations = [
    {
      id: "RES001",
      guest: "John Kamau",
      email: "john.kamau@email.com",
      phone: "+254 712 345 678",
      room: "Deluxe Suite 101",
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      guests: 2,
      status: "confirmed",
      total: "KSh 15,000",
      specialRequests: "Late check-in requested",
    },
    {
      id: "RES002",
      guest: "Sarah Wanjiku",
      email: "sarah.w@email.com",
      phone: "+254 723 456 789",
      room: "Standard Room 205",
      checkIn: "2024-01-15",
      checkOut: "2024-01-17",
      guests: 1,
      status: "pending",
      total: "KSh 8,000",
      specialRequests: "Vegetarian breakfast",
    },
    {
      id: "RES003",
      guest: "David Ochieng",
      email: "david.ochieng@email.com",
      phone: "+254 734 567 890",
      room: "Family Room 301",
      checkIn: "2024-01-16",
      checkOut: "2024-01-20",
      guests: 4,
      status: "confirmed",
      total: "KSh 24,000",
      specialRequests: "Extra bed for child",
    },
    {
      id: "RES004",
      guest: "Grace Akinyi",
      email: "grace.akinyi@email.com",
      phone: "+254 745 678 901",
      room: "Deluxe Suite 102",
      checkIn: "2024-01-16",
      checkOut: "2024-01-19",
      guests: 2,
      status: "cancelled",
      total: "KSh 18,000",
      specialRequests: "None",
    },
  ]

  const roomTypes = [
    { id: "standard", name: "Standard Room", price: 4000, available: 8 },
    { id: "deluxe", name: "Deluxe Suite", price: 7500, available: 3 },
    { id: "family", name: "Family Room", price: 6000, available: 5 },
    { id: "presidential", name: "Presidential Suite", price: 15000, available: 1 },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || reservation.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">Manage hotel bookings and guest check-ins</p>
        </div>
        <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
              <DialogDescription>Add a new guest reservation to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Guest Name</Label>
                  <Input id="guest-name" placeholder="Enter guest name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-email">Email</Label>
                  <Input id="guest-email" type="email" placeholder="guest@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Phone</Label>
                  <Input id="guest-phone" placeholder="+254 712 345 678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests-count">Number of Guests</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Guest</SelectItem>
                      <SelectItem value="2">2 Guests</SelectItem>
                      <SelectItem value="3">3 Guests</SelectItem>
                      <SelectItem value="4">4 Guests</SelectItem>
                      <SelectItem value="5">5+ Guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check-in">Check-in Date</Label>
                  <Input id="check-in" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-out">Check-out Date</Label>
                  <Input id="check-out" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-type">Room Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} - KSh {room.price.toLocaleString()}/night ({room.available} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests</Label>
                <Input id="special-requests" placeholder="Any special requirements..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsNewReservationOpen(false)}>Create Reservation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Reservations</TabsTrigger>
            <TabsTrigger value="today">Today's Arrivals</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{reservation.guest}</h3>
                          <Badge className={getStatusColor(reservation.status)}>
                            {getStatusIcon(reservation.status)}
                            <span className="ml-1 capitalize">{reservation.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Reservation ID: {reservation.id}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {reservation.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {reservation.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-sm">
                          <p className="font-medium">{reservation.room}</p>
                          <p className="text-muted-foreground">
                            {reservation.checkIn} to {reservation.checkOut}
                          </p>
                          <p className="text-muted-foreground">
                            {reservation.guests} guest{reservation.guests > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{reservation.total}</p>
                          {reservation.specialRequests !== "None" && (
                            <p className="text-xs text-muted-foreground">Special: {reservation.specialRequests}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {reservation.status === "confirmed" && (
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Arrivals</CardTitle>
              <CardDescription>Guests checking in today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReservations
                  .filter((r) => r.checkIn === "2024-01-15" && r.status === "confirmed")
                  .map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{reservation.guest}</h4>
                        <p className="text-sm text-muted-foreground">{reservation.room}</p>
                      </div>
                      <Button size="sm">Check In</Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Visual overview of reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Calendar view will be implemented with your backend integration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
