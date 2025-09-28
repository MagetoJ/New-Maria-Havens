"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, TrendingUp, DollarSign, Users, Download, Bed, UtensilsCrossed } from "lucide-react"
import { getCurrentUser, hasPermission } from "@/lib/auth"

export function ReportsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("7days")
  const currentUser = getCurrentUser()
  const canViewReports = hasPermission(currentUser, "reports_access")

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">You don&apos;t have permission to view reports.</p>
        </div>
      </div>
    )
  }

  const salesData = [
    { date: "2024-01-15", hotel: 15000, restaurant: 8500, total: 23500 },
    { date: "2024-01-14", hotel: 12000, restaurant: 9200, total: 21200 },
    { date: "2024-01-13", hotel: 18000, restaurant: 7800, total: 25800 },
    { date: "2024-01-12", hotel: 9000, restaurant: 6500, total: 15500 },
    { date: "2024-01-11", hotel: 21000, restaurant: 11200, total: 32200 },
  ]

  const topMenuItems = [
    { name: "Nyama Choma", orders: 45, revenue: 36000 },
    { name: "Fish Curry", orders: 32, revenue: 20800 },
    { name: "Ugali", orders: 78, revenue: 11700 },
    { name: "Tusker Beer", orders: 56, revenue: 14000 },
  ]

  const roomOccupancy = [
    { type: "Deluxe Suite", occupied: 8, total: 10, rate: 80 },
    { type: "Standard Room", occupied: 12, total: 15, rate: 80 },
    { type: "Family Room", occupied: 4, total: 6, rate: 67 },
    { type: "Presidential Suite", occupied: 1, total: 2, rate: 50 },
  ]

  const totalRevenue = salesData.reduce((sum, day) => sum + day.total, 0)
  const avgDailyRevenue = Math.round(totalRevenue / salesData.length)
  const hotelRevenue = salesData.reduce((sum, day) => sum + day.hotel, 0)
  const restaurantRevenue = salesData.reduce((sum, day) => sum + day.restaurant, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {avgDailyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotel Revenue</CardTitle>
            <Bed className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {hotelRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{Math.round((hotelRevenue / totalRevenue) * 100)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurant Revenue</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {restaurantRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((restaurantRevenue / totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="occupancy">Room Occupancy</TabsTrigger>
          <TabsTrigger value="menu">Menu Performance</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Breakdown</CardTitle>
              <CardDescription>Revenue breakdown by hotel and restaurant operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hotel Revenue</TableHead>
                    <TableHead>Restaurant Revenue</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((day, index) => {
                    const prevDay = salesData[index + 1]
                    const growth = prevDay ? ((day.total - prevDay.total) / prevDay.total) * 100 : 0
                    return (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell>KSh {day.hotel.toLocaleString()}</TableCell>
                        <TableCell>KSh {day.restaurant.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">KSh {day.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={growth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {growth >= 0 ? "+" : ""}
                            {growth.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Occupancy Report</CardTitle>
              <CardDescription>Current occupancy rates by room type</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Total Rooms</TableHead>
                    <TableHead>Occupancy Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomOccupancy.map((room) => (
                    <TableRow key={room.type}>
                      <TableCell className="font-medium">{room.type}</TableCell>
                      <TableCell>{room.occupied}</TableCell>
                      <TableCell>{room.total}</TableCell>
                      <TableCell>{room.rate}%</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            room.rate >= 80
                              ? "bg-green-100 text-green-800"
                              : room.rate >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {room.rate >= 80 ? "High" : room.rate >= 60 ? "Medium" : "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Menu Items</CardTitle>
              <CardDescription>Most popular dishes and their revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu Item</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMenuItems.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.orders}</TableCell>
                      <TableCell>KSh {item.revenue.toLocaleString()}</TableCell>
                      <TableCell>KSh {Math.round(item.revenue / item.orders).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Top Seller</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>Employee productivity and service metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Staff Performance Metrics</h3>
                <p className="text-muted-foreground">Detailed staff performance reports will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
