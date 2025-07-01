import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./firebase"

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
}

// Mock user for development
const mockUser: AuthUser = {
  id: "mock-user-123",
  name: "Usuario Demo",
  email: "demo@vaquitapp.com",
  avatar: "/placeholder-user.jpg",
}

// Mock authentication functions
export const loginWithGoogle = async (): Promise<AuthUser> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Store mock user in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("auth-user", JSON.stringify(mockUser))
  }

  return mockUser
}

export const logout = async (): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Remove user from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-user")
  }
}

export const getCurrentUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("auth-user")
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export const onAuthStateChange = (callback: (user: AuthUser | null) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  // Initial call
  callback(getCurrentUser())

  // Listen for storage changes (for cross-tab sync)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "auth-user") {
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

    return {
      id: user.uid,
      name: user.displayName || "Usuario",
      email: user.email || "",
      avatar: user.photoURL || undefined,
    }
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
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export const onAuthStateChangeFirebase = (callback: (user: AuthUser | null) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        id: user.uid,
        name: user.displayName || "Usuario",
        email: user.email || "",
        avatar: user.photoURL || undefined,
      })
    } else {
      callback(null)
    }
  })
}
