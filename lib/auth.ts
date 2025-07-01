export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  alias?: string
}

export interface PendingInvite {
  groupId: string
  inviteCode: string
  groupName: string
}

// Mock authentication functions
export async function loginWithGoogle(): Promise<User> {
  // Simulate login delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockUser: User = {
    uid: "mock-user-" + Date.now(),
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: "/placeholder-user.jpg",
    alias: "usuario",
  }

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(mockUser))
  }

  return mockUser
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("pendingInvite")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("currentUser")
  return stored ? JSON.parse(stored) : null
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  // Check initial state
  const user = getCurrentUser()
  callback(user)

  // Listen for storage changes
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "currentUser") {
      const user = e.newValue ? JSON.parse(e.newValue) : null
      callback(user)
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }

  return () => {}
}

export function getPendingInvite(): PendingInvite | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("pendingInvite")
  return stored ? JSON.parse(stored) : null
}

export function setPendingInvite(invite: PendingInvite): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("pendingInvite", JSON.stringify(invite))
  }
}

export function clearPendingInvite(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pendingInvite")
  }
}

export async function updateUserProfile(updates: Partial<User>): Promise<void> {
  const currentUser = getCurrentUser()
  if (!currentUser) throw new Error("No user logged in")

  const updatedUser = { ...currentUser, ...updates }

  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))
  }
}

export function validateAlias(alias: string): { isValid: boolean; error?: string } {
  if (!alias || alias.trim().length === 0) {
    return { isValid: false, error: "El alias es requerido" }
  }

  if (alias.length < 2) {
    return { isValid: false, error: "El alias debe tener al menos 2 caracteres" }
  }

  if (alias.length > 20) {
    return { isValid: false, error: "El alias no puede tener más de 20 caracteres" }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return { isValid: false, error: "El alias solo puede contener letras, números, guiones y guiones bajos" }
  }

  return { isValid: true }
}
