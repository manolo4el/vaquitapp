"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type AuthUser, getCurrentUser, onAuthStateChange } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Get initial user
      const currentUser = getCurrentUser()
      setUser(currentUser)

      // Listen for auth changes
      const unsubscribe = onAuthStateChange((user) => {
        setUser(user)
        setLoading(false)
        setError(null)
      })

      setLoading(false)

      return unsubscribe
    } catch (err) {
      console.error("Error in auth provider:", err)
      setError(err instanceof Error ? err.message : "Error de autenticación")
      setLoading(false)
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
