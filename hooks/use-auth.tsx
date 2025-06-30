"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthChange, loginWithGoogle, signOut, getCurrentUser, type AuthUser } from "@/lib/auth"

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
    // Check for existing user immediately
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
    }

    // Set up auth state listener
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser)
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

  const signIn = async () => {
    try {
      const authUser = await loginWithGoogle()
      setUser(authUser)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut: handleSignOut,
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
