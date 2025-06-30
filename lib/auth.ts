import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { auth } from "./firebase"

const googleProvider = new GoogleAuthProvider()

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

// Función para iniciar sesión con Google
export const loginWithGoogle = async (): Promise<User> => {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in can only be used in the browser")
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    throw error
  }
}

// Función para cerrar sesión
export const signOut = async (): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("Sign out can only be used in the browser")
  }

  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Función para obtener el usuario actual
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") {
    return null
  }

  return auth.currentUser
}

// Función para escuchar cambios en el estado de autenticación
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  if (!auth) {
    console.warn("Firebase Auth no está disponible")
    return () => {}
  }

  try {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "Usuario",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
          alias: firebaseUser.displayName || "Usuario",
        }

        // Guardar en localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("amigo-gastos-user", JSON.stringify(authUser))
        }

        callback(authUser)
      } else {
        // Limpiar localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("amigo-gastos-user")
        }
        callback(null)
      }
    })
  } catch (error) {
    console.error("Error configurando listener de auth:", error)
    return () => {}
  }
}

// Funciones para invitaciones pendientes
export function setPendingInvite(inviteCode: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("pending-invite", inviteCode)
  }
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("pending-invite")
}

export function clearPendingInvite(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pending-invite")
  }
}
