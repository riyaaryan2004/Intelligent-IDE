"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cpu, Lock, Mail, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log("Signup data:", { name, email, password })
    // Simulate a backend call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // For now, we'll just simulate a successful signup
    localStorage.setItem("authToken", "dummy_token")
    router.push("/ide")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Cpu className="w-12 h-12 text-blue-500 mr-4" />
          <h1 className="text-4xl font-bold text-white">Intelligent IDE</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign Up</h2>
          <div className="mb-6">
            <Label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">
              Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 bg-gray-700 text-white"
                placeholder="John Doe"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div className="mb-6">
            <Label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 bg-gray-700 text-white"
                placeholder="john@example.com"
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div className="mb-6">
            <Label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 bg-gray-700 text-white"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign Up
            </Button>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">&copy;2023 Intelligent IDE. All rights reserved.</p>
      </div>
    </div>
  )
}

