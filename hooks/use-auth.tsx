"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { loginWithGoogle, logout, onAuthStateChange, type AuthUser } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleLogin = async () => {
    try {
      setLoading(true)
      const user = await loginWithGoogle()
      setUser(user)
    } catch (error) {
      console.error("Error logging in:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logout()
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
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
