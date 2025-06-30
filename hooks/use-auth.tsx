"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getCurrentUser, onAuthChange, signInWithGoogle, signOut, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuario inicial
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    // Configurar listener de cambios
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle()
      setUser(user)
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
