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

// Login con Google (simulado por ahora)
export async function signInWithGoogle(): Promise<User> {
  // Simular login exitoso
  const mockUser: User = {
    id: "mock-user-id",
    name: "Usuario Demo",
    email: "demo@example.com",
    avatar: "https://via.placeholder.com/40",
    alias: "",
  }

  saveUser(mockUser)
  return mockUser
}

// Logout
export async function signOut(): Promise<void> {
  clearUser()
  console.log("Logout exitoso")
}

// Listener de cambios de autenticación (simplificado)
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  // Verificar usuario actual inmediatamente
  const currentUser = getCurrentUser()
  callback(currentUser)

  // Retornar función de cleanup vacía
  return () => {}
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
