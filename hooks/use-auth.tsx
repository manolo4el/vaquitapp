"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthChange, signInWithGoogle, signOut, getCurrentUser } from "@/lib/auth"

interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
    }

    // Configurar listener de cambios de autenticación
    let unsubscribe: (() => void) | undefined

    // Pequeño delay para asegurar que Firebase esté listo
    const timer = setTimeout(() => {
      try {
        unsubscribe = onAuthChange((authUser) => {
          setUser(authUser)
          setLoading(false)
        })
      } catch (error) {
        console.error("Error configurando listener de auth:", error)
        setLoading(false)
      }
    }, 100)

    // Fallback: si no se configura el listener en 2 segundos, marcar como no loading
    const fallbackTimer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const handleSignIn = async () => {
    try {
      const authUser = await signInWithGoogle()
      setUser(authUser)
    } catch (error) {
      console.error("Error en signIn:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error("Error en signOut:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
