import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { auth, googleProvider } from "./firebase"

// Sistema de autenticación con Firebase
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

const PENDING_INVITE_KEY = "amigo-gastos-pending-invite"
const USER_PROFILE_KEY = "amigo-gastos-user-profile"
const AUTH_STATE_KEY = "amigo-gastos-auth-state"

let currentUser: User | null = null
let authInitialized = false

// Convertir Firebase User a nuestro User interface
function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  // Buscar datos adicionales del perfil guardados localmente
  let additionalData = { alias: "" }

  if (typeof window !== "undefined") {
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY)
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        if (parsed.id === firebaseUser.uid) {
          additionalData = parsed
        }
      } catch (error) {
        console.error("Error parsing saved profile:", error)
      }
    }
  }

  const user: User = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || "Usuario",
    email: firebaseUser.email || "",
    avatar: firebaseUser.photoURL || undefined,
    alias: additionalData.alias || "",
  }

  // Guardar estado de autenticación en localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(user))
  }
  console.log("Usuario autenticado y guardado:", user)

  return user
}

export function getCurrentUser(): User | null {
  // Si ya tenemos el usuario en memoria, devolverlo
  if (currentUser) {
    console.log("Usuario desde memoria:", currentUser)
    return currentUser
  }

  // Solo acceder a localStorage en el cliente
  if (typeof window === "undefined") {
    return null
  }

  // Intentar cargar desde localStorage como fallback
  try {
    const savedAuth = localStorage.getItem(AUTH_STATE_KEY)
    if (savedAuth) {
      const parsedUser = JSON.parse(savedAuth)
      console.log("Usuario cargado desde localStorage:", parsedUser)
      currentUser = parsedUser
      return parsedUser
    }
  } catch (error) {
    console.error("Error al cargar usuario desde localStorage:", error)
  }

  console.log("No hay usuario autenticado")
  return null
}

export function updateUserProfile(updates: Partial<User>): User | null {
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  currentUser = updatedUser

  // Guardar datos adicionales del perfil localmente
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser))
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(updatedUser))
  }

  console.log("Perfil de usuario actualizado:", updatedUser)
  return updatedUser
}

export function isLoggedIn(): boolean {
  const user = getCurrentUser()
  const isLogged = user !== null
  console.log("¿Usuario logueado?", isLogged, user ? user.name : "No user")
  return isLogged
}

// Mejorar inicialización de autenticación
export function initializeAuth(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    console.log("Inicializando autenticación...")

    // Solo ejecutar en el cliente
    if (typeof window === "undefined") {
      resolve(null)
      return
    }

    // Si ya está inicializado, devolver el usuario actual
    if (authInitialized) {
      console.log("Auth ya inicializado, devolviendo usuario actual")
      resolve(getCurrentUser())
      return
    }

    // Verificar primero si hay un usuario en localStorage
    const savedUser = getCurrentUser()
    if (savedUser) {
      console.log("Usuario encontrado en localStorage, verificando con Firebase...")
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          console.log("Estado de autenticación de Firebase:", firebaseUser ? firebaseUser.email : "No user")

          if (firebaseUser) {
            currentUser = firebaseUserToUser(firebaseUser)
            authInitialized = true
            console.log("Usuario autenticado exitosamente:", currentUser)
            resolve(currentUser)
          } else {
            // Si Firebase dice que no hay usuario, limpiar localStorage
            currentUser = null
            if (typeof window !== "undefined") {
              localStorage.removeItem(AUTH_STATE_KEY)
              localStorage.removeItem(USER_PROFILE_KEY)
            }
            authInitialized = true
            console.log("No hay usuario autenticado en Firebase")
            resolve(null)
          }
          unsubscribe()
        },
        (error) => {
          console.error("Error en onAuthStateChanged:", error)
          authInitialized = true
          reject(error)
        },
      )

      // Timeout de seguridad
      setTimeout(() => {
        if (!authInitialized) {
          console.warn("Timeout en inicialización de auth, usando localStorage")
          unsubscribe()
          authInitialized = true
          resolve(getCurrentUser())
        }
      }, 5000)
    } catch (error) {
      console.error("Error al inicializar Firebase Auth:", error)
      authInitialized = true
      resolve(getCurrentUser()) // Usar localStorage como fallback
    }
  })
}

// Login con Google usando Firebase
export async function loginWithGoogle(): Promise<User> {
  try {
    console.log("Iniciando login con Google...")

    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      throw new Error("Login solo disponible en el cliente")
    }

    // Verificar que Firebase esté inicializado
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado")
    }

    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user

    if (!firebaseUser) {
      throw new Error("No se pudo obtener información del usuario")
    }

    console.log("Login exitoso:", firebaseUser)
    currentUser = firebaseUserToUser(firebaseUser)
    authInitialized = true

    return currentUser
  } catch (error: any) {
    console.error("Error en login con Google:", error)

    // Manejar errores específicos
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Login cancelado por el usuario")
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Popup bloqueado por el navegador. Permite popups para este sitio.")
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error("Dominio no autorizado. Contacta al administrador.")
    } else if (error.code === "auth/operation-not-allowed") {
      throw new Error("Login con Google no está habilitado. Contacta al administrador.")
    } else if (error.code === "auth/invalid-api-key") {
      throw new Error("Configuración de Firebase inválida.")
    } else {
      throw new Error(`Error al iniciar sesión: ${error.message || "Error desconocido"}`)
    }
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      await signOut(auth)
    }
    currentUser = null
    authInitialized = false
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_PROFILE_KEY)
      localStorage.removeItem(AUTH_STATE_KEY)
    }
    console.log("Logout exitoso")
  } catch (error) {
    console.error("Error en logout:", error)
    throw new Error("Error al cerrar sesión")
  }
}

// Manejar invitación pendiente
export function setPendingInvite(inviteCode: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PENDING_INVITE_KEY, inviteCode)
  console.log("Invitación pendiente guardada:", inviteCode)
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null
  const invite = localStorage.getItem(PENDING_INVITE_KEY)
  console.log("Invitación pendiente:", invite)
  return invite
}

export function clearPendingInvite(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PENDING_INVITE_KEY)
  console.log("Invitación pendiente limpiada")
}

// Validar alias/CBU/CVU
export function validateAlias(alias: string): { isValid: boolean; error?: string } {
  if (!alias || alias.trim().length === 0) {
    return { isValid: false, error: "El alias/CBU es obligatorio" }
  }

  const trimmedAlias = alias.trim()

  // Validar formato: alfanumérico o exactamente 22 dígitos
  const isAlphanumeric = /^[a-zA-Z0-9.]+$/.test(trimmedAlias)
  const is22Digits = /^\d{22}$/.test(trimmedAlias)

  if (!isAlphanumeric && !is22Digits) {
    return {
      isValid: false,
      error: "Debe ser un alias alfanumérico o un CBU/CVU de 22 dígitos",
    }
  }

  if (trimmedAlias.length < 3 && !is22Digits) {
    return {
      isValid: false,
      error: "El alias debe tener al menos 3 caracteres",
    }
  }

  return { isValid: true }
}
