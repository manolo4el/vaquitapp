"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { onAuthChange, getCurrentUser, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar usuario inicial inmediatamente
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
    }

    // Configurar listener de cambios de autenticación
    try {
      const unsubscribe = onAuthChange((user) => {
        setUser(user)
        setLoading(false)
        setError(null)
      })

      return unsubscribe
    } catch (err) {
      console.error("Error setting up auth listener:", err)
      setError("Error al configurar autenticación")
      setLoading(false)
      return () => {}
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
