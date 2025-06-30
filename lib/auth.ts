import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { getFirebaseAuth, getGoogleProvider } from "./firebase"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

// Claves para localStorage
const USER_STORAGE_KEY = "amigo-gastos-user"
const PENDING_INVITE_KEY = "amigo-gastos-pending-invite"

// Función para convertir usuario de Firebase a nuestro formato
function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuario",
    email: firebaseUser.email || "",
    avatar: firebaseUser.photoURL || undefined,
    alias: "", // Se configurará en el perfil
  }
}

// Función para obtener usuario actual
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

// Función para guardar usuario
function saveUser(user: User): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    console.error("Error al guardar usuario:", error)
  }
}

// Función para limpiar usuario
function clearUser(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(USER_STORAGE_KEY)
  } catch (error) {
    console.error("Error al limpiar usuario:", error)
  }
}

// Login con Google
export async function signInWithGoogle(): Promise<User> {
  if (typeof window === "undefined") {
    throw new Error("Sign in can only be performed on the client side")
  }

  try {
    const auth = getFirebaseAuth()
    const provider = getGoogleProvider()
    const result = await signInWithPopup(auth, provider)
    const firebaseUser = result.user

    if (!firebaseUser) {
      throw new Error("No se pudo obtener información del usuario")
    }

    console.log("Login exitoso:", firebaseUser.email)

    // Convertir a nuestro formato
    const user = mapFirebaseUser(firebaseUser)

    // Guardar en localStorage
    saveUser(user)

    return user
  } catch (error: any) {
    console.error("Error signing in with Google:", error)

    // Manejar errores específicos
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Login cancelado por el usuario")
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Popup bloqueado por el navegador")
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("Error de conexión. Verifica tu internet.")
    } else {
      throw new Error(error.message || "Error al iniciar sesión")
    }
  }
}

// Alias para compatibilidad
export const loginWithGoogle = signInWithGoogle

// Logout
export async function signOut(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Sign out can only be performed on the client side")
  }

  try {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
    clearUser()
    console.log("Logout exitoso")
  } catch (error: any) {
    console.error("Error signing out:", error)
    // Limpiar usuario aunque haya error en Firebase
    clearUser()
    throw new Error(error.message || "Error al cerrar sesión")
  }
}

// Listener de cambios de autenticación
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  try {
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = mapFirebaseUser(firebaseUser)
        saveUser(user)
        callback(user)
      } else {
        clearUser()
        callback(null)
      }
    })
  } catch (error) {
    console.error("Error setting up auth listener:", error)
    // Verificar usuario desde localStorage como fallback
    const currentUser = getCurrentUser()
    callback(currentUser)
    return () => {}
  }
}

// Funciones para manejar invitaciones pendientes
export function setPendingInvite(inviteCode: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PENDING_INVITE_KEY, inviteCode)
  } catch (error) {
    console.error("Error al guardar invitación pendiente:", error)
  }
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null

  try {
    return localStorage.getItem(PENDING_INVITE_KEY)
  } catch (error) {
    console.error("Error al obtener invitación pendiente:", error)
    return null
  }
}

export function clearPendingInvite(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(PENDING_INVITE_KEY)
  } catch (error) {
    console.error("Error al limpiar invitación pendiente:", error)
  }
}

// Función para actualizar perfil de usuario
export function updateUserProfile(updates: Partial<Pick<User, "name" | "alias">>): User | null {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  saveUser(updatedUser)

  return updatedUser
}

// Función para validar alias
export function validateAlias(alias: string): { isValid: boolean; error?: string } {
  if (!alias.trim()) {
    return { isValid: false, error: "El alias es obligatorio" }
  }

  // Validar CBU/CVU (22 dígitos)
  if (/^\d{22}$/.test(alias)) {
    return { isValid: true }
  }

  // Validar alias alfanumérico
  if (/^[a-zA-Z0-9._-]+$/.test(alias) && alias.length >= 3 && alias.length <= 30) {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: "Debe ser un alias válido (3-30 caracteres alfanuméricos) o un CBU/CVU de 22 dígitos",
  }
}
