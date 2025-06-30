"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getCurrentUser, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshUser: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/lib/auth")
      await logout()
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  useEffect(() => {
    // Verificar usuario inicial
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)

    // Configurar listener de cambios de autenticación
    let unsubscribe: (() => void) | null = null

    const setupAuthListener = async () => {
      try {
        const { onAuthChange } = await import("@/lib/auth")
        unsubscribe = onAuthChange((user) => {
          setUser(user)
          setIsLoading(false)
        })
      } catch (error) {
        console.error("Error al configurar listener de auth:", error)
        setIsLoading(false)
      }
    }

    // Solo configurar el listener en el cliente
    if (typeof window !== "undefined") {
      setupAuthListener()
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    refreshUser,
    logout: handleLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
