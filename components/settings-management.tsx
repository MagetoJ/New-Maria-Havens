"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Bell, Shield, Mail, Phone } from "lucide-react"
import { getCurrentUser, hasPermission } from "@/lib/auth"

export function SettingsManagement() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    booking: true,
    payment: true,
    maintenance: false,
  })

  const currentUser = getCurrentUser()
  const canManageSettings = hasPermission(currentUser, "settings_access")

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">You don't have permission to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Admin Settings</span>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
                <CardDescription>Basic hotel details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Hotel Name</Label>
                  <Input id="hotel-name" defaultValue="Maria Havens Hotel & Restaurant" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-address">Address</Label>
                  <Textarea id="hotel-address" defaultValue="123 Uhuru Highway, Nairobi, Kenya" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotel-phone">Phone</Label>
                    <Input id="hotel-phone" defaultValue="+254 700 123 456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotel-email">Email</Label>
                    <Input id="hotel-email" defaultValue="info@mariahavens.com" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Operating hours for hotel and restaurant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hotel Reception</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input defaultValue="24 Hours" disabled />
                    <Input defaultValue="Daily" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Restaurant</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input defaultValue="6:00 AM" />
                    <Input defaultValue="11:00 PM" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input defaultValue="5:00 PM" />
                    <Input defaultValue="2:00 AM" />
                  </div>
                </div>
                <Button>Update Hours</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4" />
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Event Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>New Bookings</Label>
                    <Switch
                      checked={notifications.booking}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, booking: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Payment Received</Label>
                    <Switch
                      checked={notifications.payment}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, payment: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Maintenance Alerts</Label>
                    <Switch
                      checked={notifications.maintenance}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, maintenance: checked })}
                    />
                  </div>
                </div>
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateways</CardTitle>
                <CardDescription>Configure payment processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>M-Pesa Integration</Label>
                    <p className="text-sm text-muted-foreground">Mobile money payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Card Payments</Label>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard processing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">Direct bank transfers</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline">Configure Payments</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Services</CardTitle>
                <CardDescription>Third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Service</Label>
                    <p className="text-sm text-muted-foreground">SMTP configuration</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Gateway</Label>
                    <p className="text-sm text-muted-foreground">SMS notifications</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Booking Engine</Label>
                    <p className="text-sm text-muted-foreground">Online reservations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline">Manage Integrations</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>User authentication and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Two-Factor Authentication</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Password Complexity</Label>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline">Security Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>User Activity Logging</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Transaction Logging</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System Changes</Label>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline">View Audit Logs</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>Data backup and recovery settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Retention Period</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto Backup</Label>
                  <Switch defaultChecked />
                </div>
                <Button>Configure Backup</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Status</CardTitle>
                <CardDescription>Recent backup information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-sm font-medium">2024-01-15 03:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Backup Size</span>
                    <span className="text-sm font-medium">2.4 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <span className="text-sm font-medium text-green-600">Successful</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Create Backup
                  </Button>
                  <Button variant="outline" size="sm">
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
