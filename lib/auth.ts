import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./firebase"

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

// Mock user for development
const mockUser: AuthUser = {
  id: "mock-user-123",
  name: "Usuario Demo",
  email: "demo@vaquitapp.com",
  avatar: "/placeholder-user.jpg",
  alias: "demo",
}

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
export const loginWithGoogle = async (): Promise<AuthUser> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Store mock user in localStorage
  saveUser(mockUser)
  return mockUser
}

// Sign out
export const logout = async (): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Remove user from localStorage
  clearUser()
}

// Auth state listener (simplified)
export const onAuthStateChange = (callback: (user: AuthUser | null) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  // Initial call
  callback(getCurrentUser())

  // Listen for storage changes (for cross-tab sync)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === USER_STORAGE_KEY) {
      const user = e.newValue ? JSON.parse(e.newValue) : null
      callback(user)
    }
  }

  window.addEventListener("storage", handleStorageChange)

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange)
  }
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

// Firebase auth functions (for future use)
export const loginWithGoogleFirebase = async (): Promise<AuthUser> => {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth can only be used on the client side")
  }

  try {
    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    const authUser: AuthUser = {
      id: user.uid,
      name: user.displayName || "Usuario",
      email: user.email || "",
      avatar: user.photoURL || undefined,
      alias: user.displayName || "Usuario",
    }

    saveUser(authUser)
    return authUser
  } catch (error) {
    console.error("Error signing in with Google:", error)
    throw error
  }
}

export const logoutFirebase = async (): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth can only be used on the client side")
  }

  try {
    await signOut(auth)
    clearUser()
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export const onAuthStateChangeFirebase = (callback: (user: AuthUser | null) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const authUser: AuthUser = {
        id: user.uid,
        name: user.displayName || "Usuario",
        email: user.email || "",
        avatar: user.photoURL || undefined,
        alias: user.displayName || "Usuario",
      }
      saveUser(authUser)
      callback(authUser)
    } else {
      clearUser()
      callback(null)
    }
  })
}
