export interface Member {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: string
  category?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  inviteCode?: string
}

const STORAGE_KEY = "vaquitapp_groups"

export function getGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading groups:", error)
    return []
  }
}

export function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error saving groups:", error)
  }
}

export function createGroup(name: string, description?: string): Group {
  const group: Group = {
    id: generateId(),
    name,
    description,
    members: [],
    expenses: [],
    createdAt: new Date().toISOString(),
    inviteCode: generateInviteCode(),
  }

  const groups = getGroups()
  groups.push(group)
  saveGroups(groups)

  return group
}

export function getGroup(id: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.id === id) || null
}

export function updateGroup(updatedGroup: Group): void {
  const groups = getGroups()
  const index = groups.findIndex((group) => group.id === updatedGroup.id)

  if (index !== -1) {
    groups[index] = updatedGroup
    saveGroups(groups)
  }
}

export function deleteGroup(id: string): void {
  const groups = getGroups()
  const filteredGroups = groups.filter((group) => group.id !== id)
  saveGroups(filteredGroups)
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}
