"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  loginWithGoogle as authLogin,
  logout as authLogout,
  getCurrentUser,
} from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user immediately
    const initialUser = getCurrentUser()
    if (initialUser) {
      setUser(initialUser)
      setLoading(false)
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    // Fallback to stop loading after 1 second
    const fallbackTimer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => {
      unsubscribe()
      clearTimeout(fallbackTimer)
    }
  }, [])

  const login = async () => {
    setLoading(true)
    try {
      const user = await authLogin()
      setUser(user)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authLogout()
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
