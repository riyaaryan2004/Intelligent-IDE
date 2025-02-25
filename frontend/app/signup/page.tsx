"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cpu, Lock, Mail, User } from "lucide-react"
import { useRouter } from "next/navigation"

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AuthPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLogin, setIsLogin] = useState(false) // Toggle between login and signup
  const router = useRouter()

  const isStrongPassword = (password: string) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isLogin && !isStrongPassword(password)) {
      setError("Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character.")
      return
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email, password } : { username: name, email, password };

      const response = await fetch(`${backendURL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isLogin ? "Login failed" : "Registration failed"))
      }

      localStorage.setItem("authToken", data.data.token)
      router.push("/ide") // Redirect after successful login/signup
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Cpu className="w-12 h-12 text-blue-500 mr-4" />
          <h1 className="text-4xl font-bold text-white">Intelligent IDE</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLogin ? "Login" : "Sign Up"}</h2>

          {!isLogin && (
            <div className="mb-6">
              <Label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 bg-gray-700 text-white"
                  placeholder="John Doe"
                  required={!isLogin}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
          )}

          <div className="mb-6">
            <Label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</Label>
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
            <Label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Password</Label>
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

          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

          <div className="flex flex-col items-center">
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              {isLogin ? "Login" : "Sign Up"}
            </Button>
            <p className="text-gray-400 text-sm mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                className="text-blue-400 cursor-pointer hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">&copy;2023 Intelligent IDE. All rights reserved.</p>
      </div>
    </div>
  )
}
