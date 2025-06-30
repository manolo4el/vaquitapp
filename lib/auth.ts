import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { auth, googleProvider } from "./firebase"

// Sistema de autenticación con Firebase
export interface User {
  id: string // Firebase UID
  name: string
  email: string
  avatar?: string
  alias?: string
  provider?: string // Agregar proveedor para debugging
}

const PENDING_INVITE_KEY = "amigo-gastos-pending-invite"
const USER_PROFILE_KEY = "amigo-gastos-user-profile"
const AUTH_STATE_KEY = "amigo-gastos-auth-state"

let currentUser: User | null = null
let authInitialized = false

// Convertir Firebase User a nuestro User interface
function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  console.log("🔄 Converting Firebase user:", {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    providerData: firebaseUser.providerData
  })

  // Buscar datos adicionales del perfil guardados localmente
  const savedProfile = localStorage.getItem(USER_PROFILE_KEY)
  let additionalData = { alias: "" }

  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile)
      // ✅ Buscar por email también, no solo por ID
      if (parsed.id === firebaseUser.uid || parsed.email === firebaseUser.email) {
        additionalData = parsed
        console.log("📦 Found saved profile for user:", parsed)
      }
    } catch (error) {
      console.error("Error parsing saved profile:", error)
    }
  }

  const user: User = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || "Usuario",
    email: firebaseUser.email || "",
    avatar: firebaseUser.photoURL || undefined,
    alias: additionalData.alias || "",
    provider: firebaseUser.providerData[0]?.providerId || "unknown"
  }

  // ✅ Guardar estado de autenticación en localStorage
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(user))
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user))
  
  console.log("✅ Usuario autenticado y guardado:", {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider
  })

  return user
}

export function getCurrentUser(): User | null {
  // ✅ Si ya tenemos el usuario en memoria, devolverlo
  if (currentUser) {
    console.log("👤 Usuario desde memoria:", currentUser.email)
    return currentUser
  }

  // ✅ Intentar cargar desde localStorage como fallback
  try {
    const savedAuth = localStorage.getItem(AUTH_STATE_KEY)
    if (savedAuth) {
      const parsedUser = JSON.parse(savedAuth)
      console.log("📱 Usuario cargado desde localStorage:", parsedUser.email)
      currentUser = parsedUser
      return parsedUser
    }
  } catch (error) {
    console.error("Error al cargar usuario desde localStorage:", error)
  }

  console.log("❌ No hay usuario autenticado")
  return null
}

export function updateUserProfile(updates: Partial<User>): User | null {
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  currentUser = updatedUser

  // Guardar datos adicionales del perfil localmente
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser))
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(updatedUser))

  console.log("🔄 Perfil de usuario actualizado:", updatedUser)
  return updatedUser
}

export function isLoggedIn(): boolean {
  const user = getCurrentUser()
  const isLogged = user !== null
  console.log("🔐 ¿Usuario logueado?", isLogged, user ? user.email : "No user")
  return isLogged
}

// ✅ Mejorar inicialización de autenticación
export function initializeAuth(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    console.log("🚀 Inicializando autenticación...")

    // Si ya está inicializado, devolver el usuario actual
    if (authInitialized) {
      console.log("✅ Auth ya inicializado, devolviendo usuario actual")
      resolve(getCurrentUser())
      return
    }

    // ✅ Verificar primero si hay un usuario en localStorage
    const savedUser = getCurrentUser()
    if (savedUser) {
      console.log("📱 Usuario encontrado en localStorage, verificando con Firebase...")
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        console.log("🔥 Estado de autenticación de Firebase:", firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          provider: firebaseUser.providerData[0]?.providerId
        } : "No user")

        if (firebaseUser) {
          currentUser = firebaseUserToUser(firebaseUser)
          authInitialized = true
          console.log("✅ Usuario autenticado exitosamente:", currentUser.email)
          resolve(currentUser)
        } else {
          // ✅ Si Firebase dice que no hay usuario, limpiar localStorage
          currentUser = null
          localStorage.removeItem(AUTH_STATE_KEY)
          localStorage.removeItem(USER_PROFILE_KEY)
          authInitialized = true
          console.log("❌ No hay usuario autenticado en Firebase")
          resolve(null)
        }
        unsubscribe()
      },
      (error) => {
        console.error("❌ Error en onAuthStateChanged:", error)
        authInitialized = true
        reject(error)
      },
    )

    // ✅ Timeout de seguridad
    setTimeout(() => {
      if (!authInitialized) {
        console.warn("⏰ Timeout en inicialización de auth, usando localStorage")
        unsubscribe()
        authInitialized = true
        resolve(getCurrentUser())
      }
    }, 5000)
  })
}

// Login con Google usando Firebase
export async function loginWithGoogle(): Promise<User> {
  try {
    console.log("🔐 Iniciando login con Google...")

    // Verificar que Firebase esté inicializado
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado")
    }

    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user

    if (!firebaseUser) {
      throw new Error("No se pudo obtener información del usuario")
    }

    console.log("✅ Login exitoso:", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      provider: firebaseUser.providerData[0]?.providerId
    })
    
    currentUser = firebaseUserToUser(firebaseUser)
    authInitialized = true

    return currentUser
  } catch (error: any) {
    console.error("❌ Error en login con Google:", error)

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
    console.log("🚪 Iniciando logout...")
    await signOut(auth)
    
    // Limpiar estado local
    currentUser = null
    localStorage.removeItem(AUTH_STATE_KEY)
    localStorage.removeItem(USER_PROFILE_KEY)
    authInitialized = false
    
    console.log("✅ Logout exitoso")
  } catch (error) {
    console.error("❌ Error en logout:", error)
    throw error
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

// ✅ Función de debugging para diagnosticar problemas de usuarios
export function debugUserState(): void {
  console.log("🔍 === DEBUG USER STATE ===")
  
  // Verificar localStorage
  const savedAuth = localStorage.getItem(AUTH_STATE_KEY)
  const savedProfile = localStorage.getItem(USER_PROFILE_KEY)
  
  console.log("📱 localStorage AUTH_STATE:", savedAuth ? JSON.parse(savedAuth) : "null")
  console.log("📱 localStorage USER_PROFILE:", savedProfile ? JSON.parse(savedProfile) : "null")
  
  // Verificar estado en memoria
  console.log("🧠 Current user in memory:", currentUser)
  console.log("🔧 Auth initialized:", authInitialized)
  
  // Verificar Firebase Auth
  if (auth) {
    const firebaseUser = auth.currentUser
    console.log("🔥 Firebase current user:", firebaseUser ? {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      provider: firebaseUser.providerData[0]?.providerId
    } : "null")
  }
  
  console.log("🔍 === END DEBUG ===")
}

// ✅ Función para limpiar datos de usuario (útil para testing)
export function clearUserData(): void {
  console.log("🧹 Limpiando datos de usuario...")
  currentUser = null
  authInitialized = false
  localStorage.removeItem(AUTH_STATE_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
  console.log("✅ Datos de usuario limpiados")
}
