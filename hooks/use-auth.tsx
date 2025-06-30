"use client"

import { useState, useEffect } from "react"
import { onAuthChange, signInWithGoogle, signOut, getCurrentUser, type User } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuario actual inmediatamente
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
    }

    // Configurar listener de cambios de autenticación
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })

    // Timeout de seguridad para evitar loading infinito
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signIn = async () => {
    try {
      const user = await signInWithGoogle()
      setUser(user)
      return user
    } catch (error) {
      console.error("Error in signIn:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error("Error in signOut:", error)
      throw error
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut: handleSignOut,
  }
}
