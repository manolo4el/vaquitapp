"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { initializeAuth, getCurrentUser, logout as authLogout } from "@/lib/auth"
import type { User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("AuthProvider: Inicializando...")

    // ✅ Intentar cargar usuario inmediatamente desde localStorage
    const savedUser = getCurrentUser()
    if (savedUser) {
      console.log("AuthProvider: Usuario encontrado en localStorage")
      setUser(savedUser)
      setIsLoading(false)
    }

    // ✅ Luego verificar con Firebase
    initializeAuth()
      .then((authenticatedUser) => {
        console.log("AuthProvider: Firebase auth completado:", authenticatedUser ? authenticatedUser.name : "No user")
        setUser(authenticatedUser)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("AuthProvider: Error initializing auth:", error)
        setUser(null)
        setIsLoading(false)
      })
  }, [])

  const logout = async () => {
    try {
      await authLogout()
      setUser(null)
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const refreshUser = () => {
    const currentUser = getCurrentUser()
    console.log("AuthProvider: Refreshing user:", currentUser ? currentUser.name : "No user")
    setUser(currentUser)
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  }

  console.log("AuthProvider: Estado actual:", {
    user: user ? user.name : "No user",
    isLoading,
    isAuthenticated: !!user,
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
