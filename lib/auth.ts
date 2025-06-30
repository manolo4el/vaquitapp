// Mock authentication system to avoid Firebase initialization issues
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

// Storage keys
const USER_STORAGE_KEY = "amigo-gastos-user"
const PENDING_INVITE_KEY = "amigo-gastos-pending-invite"

// Get current user from localStorage
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Save user to localStorage
function saveUser(user: AuthUser): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    console.error("Error saving user:", error)
  }
}

// Clear user from localStorage
function clearUser(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(USER_STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing user:", error)
  }
}

// Mock Google sign in
export async function loginWithGoogle(): Promise<AuthUser> {
  // Simulate loading time
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Create mock user
  const mockUser: AuthUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
    email: "demo@vaquitapp.com",
    avatar: "https://via.placeholder.com/40",
    alias: "demo",
  }

  saveUser(mockUser)
  return mockUser
}

// Sign out
export async function signOut(): Promise<void> {
  clearUser()
  console.log("User signed out")
}

// Auth state listener (simplified)
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  // Check current user immediately
  const currentUser = getCurrentUser()
  callback(currentUser)

  // Return empty cleanup function
  return () => {}
}

// Pending invite functions
export function setPendingInvite(inviteCode: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PENDING_INVITE_KEY, inviteCode)
  } catch (error) {
    console.error("Error setting pending invite:", error)
  }
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null

  try {
    return localStorage.getItem(PENDING_INVITE_KEY)
  } catch (error) {
    console.error("Error getting pending invite:", error)
    return null
  }
}

export function clearPendingInvite(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(PENDING_INVITE_KEY)
  } catch (error) {
    console.error("Error clearing pending invite:", error)
  }
}

// Update user profile
export function updateUserProfile(updates: Partial<Pick<AuthUser, "name" | "alias">>): AuthUser | null {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  saveUser(updatedUser)

  return updatedUser
}

// Validate alias
export function validateAlias(alias: string): { isValid: boolean; error?: string } {
  if (!alias.trim()) {
    return { isValid: false, error: "El alias es obligatorio" }
  }

  // Validate CBU/CVU (22 digits)
  if (/^\d{22}$/.test(alias)) {
    return { isValid: true }
  }

  // Validate alphanumeric alias
  if (/^[a-zA-Z0-9._-]+$/.test(alias) && alias.length >= 3 && alias.length <= 30) {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: "Debe ser un alias válido (3-30 caracteres alfanuméricos) o un CBU/CVU de 22 dígitos",
  }
}
