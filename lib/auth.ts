export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

export interface PendingInvite {
  groupId: string
  inviteCode: string
  groupName: string
}

// Mock user storage
const MOCK_USER_KEY = "vaquitapp_mock_user"
const PENDING_INVITE_KEY = "vaquitapp_pending_invite"

// Mock authentication functions
export async function loginWithGoogle(): Promise<User> {
  // Simulate Google login
  const mockUser: User = {
    uid: "mock-user-" + Date.now(),
    email: "usuario@ejemplo.com",
    displayName: "Usuario Demo",
    photoURL: "https://via.placeholder.com/150",
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser))
  }

  return mockUser
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_USER_KEY)
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(MOCK_USER_KEY)
  return stored ? JSON.parse(stored) : null
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  // Mock auth state listener
  const user = getCurrentUser()
  callback(user)

  // Return unsubscribe function
  return () => {}
}

// Pending invite functions
export function setPendingInvite(invite: PendingInvite): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite))
  }
}

export function getPendingInvite(): PendingInvite | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(PENDING_INVITE_KEY)
  return stored ? JSON.parse(stored) : null
}

export function clearPendingInvite(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_INVITE_KEY)
  }
}

// User profile functions
export async function updateUserProfile(updates: Partial<User>): Promise<void> {
  const currentUser = getCurrentUser()
  if (!currentUser) throw new Error("No user logged in")

  const updatedUser = { ...currentUser, ...updates }

  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updatedUser))
  }
}

// Alias validation
export function validateAlias(alias: string): { isValid: boolean; error?: string } {
  if (!alias || alias.trim().length === 0) {
    return { isValid: false, error: "El alias no puede estar vacío" }
  }

  if (alias.length < 2) {
    return { isValid: false, error: "El alias debe tener al menos 2 caracteres" }
  }

  if (alias.length > 20) {
    return { isValid: false, error: "El alias no puede tener más de 20 caracteres" }
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(alias)) {
    return { isValid: false, error: "El alias solo puede contener letras, números y espacios" }
  }

  return { isValid: true }
}
