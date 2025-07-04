"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAnalytics } from "@/hooks/use-analytics"

interface UserProfile {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  paymentInfo?: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  login: () => Promise<void>
  logout: () => Promise<void>
  updatePaymentInfo: (paymentInfo: string) => Promise<void>
  loading: boolean
  authError: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const { trackUserAction } = useAnalytics()

  useEffect(() => {
    // Verificar si hay un resultado de redirect pendiente
    const checkRedirectResult = async () => {
      try {
        console.log("Checking for redirect result...")
        const result = await getRedirectResult(auth)
        if (result) {
          console.log("Redirect result found:", result.user.email)
        }
      } catch (error: any) {
        console.error("Error getting redirect result:", error)
        setAuthError(getErrorMessage(error))
      }
    }

    checkRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "No user")
      setAuthError(null) // Limpiar errores previos

      try {
        if (firebaseUser) {
          // Crear o actualizar el documento del usuario
          await createOrUpdateUserProfile(firebaseUser)
        } else {
          setUserProfile(null)
          setUser(null)
        }
      } catch (error: any) {
        console.error("Error handling auth state change:", error)
        setAuthError(getErrorMessage(error))

        // Si es un error de permisos, aún establecer el usuario para mostrar las instrucciones
        if (error.code === "permission-denied") {
          setUser(firebaseUser)
          setUserProfile(null)
        }
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/popup-blocked":
        return "El popup fue bloqueado por el navegador. Habilita los popups o intenta de nuevo."
      case "auth/popup-closed-by-user":
        return "El popup fue cerrado antes de completar el login."
      case "auth/cancelled-popup-request":
        return "Solicitud de popup cancelada."
      case "auth/unauthorized-domain":
        return "Este dominio no está autorizado para usar Firebase Auth. Contacta al administrador."
      case "auth/operation-not-allowed":
        return "El login con Google no está habilitado. Contacta al administrador."
      case "auth/account-exists-with-different-credential":
        return "Ya existe una cuenta con este email usando un método diferente."
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada."
      case "auth/too-many-requests":
        return "Demasiados intentos fallidos. Intenta de nuevo más tarde."
      case "permission-denied":
        return "Sin permisos para acceder a la base de datos. Verifica la configuración de Firestore."
      default:
        return error.message || "Error desconocido durante la autenticación."
    }
  }

  const createOrUpdateUserProfile = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid)

    try {
      const userSnap = await getDoc(userRef)
      let profileData: UserProfile

      if (!userSnap.exists()) {
        profileData = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
        }
        await setDoc(userRef, profileData)
        console.log("Created new user profile for:", firebaseUser.email)
      } else {
        profileData = userSnap.data() as UserProfile
        console.log("Loaded existing user profile for:", firebaseUser.email)
      }

      setUserProfile(profileData)
      setUser(firebaseUser)
    } catch (error: any) {
      console.error("Error with user profile:", error)
      throw error // Re-throw para que se maneje arriba
    }
  }

  const login = async () => {
    try {
      setLoading(true)
      setAuthError(null)

      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.addScope("profile")

      // Configurar el provider para forzar selección de cuenta
      provider.setCustomParameters({
        prompt: "select_account",
      })

      console.log("Attempting popup login...")

      try {
        // Intentar popup primero
        const result = await signInWithPopup(auth, provider)
        console.log("Popup login successful:", result.user.email)
        trackUserAction("login_attempt", { method: "google_popup" })
      } catch (popupError: any) {
        console.log("Popup failed, trying redirect:", popupError.message)

        // Si el popup falla, usar redirect
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/cancelled-popup-request" ||
          popupError.message.includes("popup")
        ) {
          console.log("Using redirect instead of popup...")
          await signInWithRedirect(auth, provider)
          // No setLoading(false) aquí porque la página se va a recargar
          return
        } else {
          throw popupError
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setAuthError(getErrorMessage(error))
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setAuthError(null)
      console.log("User logged out successfully")
      trackUserAction("logout", { user_id: user?.uid })
    } catch (error: any) {
      console.error("Logout error:", error)
      setAuthError(getErrorMessage(error))
    }
  }

  const updatePaymentInfo = async (paymentInfo: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { paymentInfo })

      if (userProfile) {
        setUserProfile({ ...userProfile, paymentInfo })
      }
    } catch (error: any) {
      console.error("Error updating payment info:", error)
      throw error
    }
  }

  const clearError = () => {
    setAuthError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        login,
        logout,
        updatePaymentInfo,
        loading,
        authError,
        clearError,
      }}
    >
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
