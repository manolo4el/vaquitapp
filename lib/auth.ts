import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { getFirebaseAuth } from "./firebase"

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

// Función para iniciar sesión con Google
export async function signInWithGoogle(): Promise<AuthUser> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error("Firebase Auth no está disponible")
  }

  try {
    const provider = new GoogleAuthProvider()
    provider.addScope("profile")
    provider.addScope("email")

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    const authUser: AuthUser = {
      id: user.uid,
      name: user.displayName || "Usuario",
      email: user.email || "",
      avatar: user.photoURL || undefined,
      alias: user.displayName || "Usuario",
    }

    // Guardar en localStorage para persistencia
    if (typeof window !== "undefined") {
      localStorage.setItem("amigo-gastos-user", JSON.stringify(authUser))
    }

    return authUser
  } catch (error: any) {
    console.error("Error en signInWithGoogle:", error)
    throw new Error(error.message || "Error al iniciar sesión con Google")
  }
}

// Función para cerrar sesión
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error("Firebase Auth no está disponible")
  }

  try {
    await firebaseSignOut(auth)

    // Limpiar localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("amigo-gastos-user")
    }
  } catch (error: any) {
    console.error("Error en signOut:", error)
    throw new Error(error.message || "Error al cerrar sesión")
  }
}

// Función para obtener el usuario actual
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("amigo-gastos-user")
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

// Función para escuchar cambios en el estado de autenticación
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const auth = getFirebaseAuth()
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

// Alias para compatibilidad
export const loginWithGoogle = signInWithGoogle

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
