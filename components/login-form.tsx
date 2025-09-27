"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Hotel, Lock, Mail, Info } from "lucide-react"
import Link from "next/link"

const MOCK_USERS = [
  { email: "admin@mariahavens.com", password: "admin123", role: "admin", name: "John Kamau" },
  { email: "manager@mariahavens.com", password: "manager123", role: "manager", name: "Sarah Wanjiku" },
  { email: "receptionist@mariahavens.com", password: "reception123", role: "receptionist", name: "Peter Mwangi" },
  { email: "waiter@mariahavens.com", password: "waiter123", role: "waiter", name: "Grace Akinyi" },
  { email: "kitchen@mariahavens.com", password: "kitchen123", role: "kitchen", name: "David Ochieng" },
]

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCredentials, setShowCredentials] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate login - you'll replace this with your backend integration
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const user = MOCK_USERS.find((u) => u.email === email && u.password === password)

      if (user) {
        // Store user info in localStorage for role-based dashboard
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: `USR${Math.random().toString(36).substr(2, 9)}`,
            name: user.name,
            email: user.email,
            role: user.role,
            status: "active",
            lastLogin: new Date().toISOString(),
            createdAt: "2024-01-01",
          }),
        )

        // Redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail)
    setPassword(userPassword)
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Hotel className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Maria Havens POS account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full"
            >
              <Info className="h-4 w-4 mr-2" />
              {showCredentials ? "Hide" : "Show"} Test Credentials
            </Button>

            {showCredentials && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                <p className="font-medium text-muted-foreground">Click to auto-fill:</p>
                {MOCK_USERS.map((user, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => quickLogin(user.email, user.password)}
                    className="w-full justify-start text-left h-auto p-2"
                  >
                    <div>
                      <div className="font-medium">
                        {user.name} ({user.role})
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
