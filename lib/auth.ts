export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

// Mock authentication system
let currentUser: User | null = null
let authListeners: ((user: User | null) => void)[] = []

export function onAuthStateChanged(callback: (user: User | null) => void) {
  authListeners.push(callback)

  // Immediately call with current user
  setTimeout(() => callback(currentUser), 0)

  return () => {
    authListeners = authListeners.filter((listener) => listener !== callback)
  }
}

export async function loginWithGoogle(): Promise<User> {
  // Mock Google login
  const mockUser: User = {
    id: "mock-user-id",
    name: "Usuario Demo",
    email: "demo@vaquitapp.com",
    avatar: "/placeholder.svg?height=40&width=40&text=U",
  }

  currentUser = mockUser

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("vaquitapp-user", JSON.stringify(mockUser))
  }

  // Notify listeners
  authListeners.forEach((listener) => listener(mockUser))

  return mockUser
}

export async function logout(): Promise<void> {
  currentUser = null

  if (typeof window !== "undefined") {
    localStorage.removeItem("vaquitapp-user")
  }

  // Notify listeners
  authListeners.forEach((listener) => listener(null))
}

export function getCurrentUser(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("vaquitapp-user")
    if (stored) {
      try {
        currentUser = JSON.parse(stored)
        return currentUser
      } catch {
        localStorage.removeItem("vaquitapp-user")
      }
    }
  }
  return currentUser
}

// Additional required exports
export function getPendingInvite(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("pending-invite")
  }
  return null
}

export function clearPendingInvite(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pending-invite")
  }
}

export function setPendingInvite(inviteCode: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("pending-invite", inviteCode)
  }
}

export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  if (!currentUser) throw new Error("No user logged in")

  currentUser = { ...currentUser, ...updates }

  if (typeof window !== "undefined") {
    localStorage.setItem("vaquitapp-user", JSON.stringify(currentUser))
  }

  // Notify listeners
  authListeners.forEach((listener) => listener(currentUser))

  return currentUser
}

export function validateAlias(alias: string): boolean {
  return alias.length >= 2 && alias.length <= 20 && /^[a-zA-Z0-9_]+$/.test(alias)
}
