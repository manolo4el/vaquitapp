export interface Group {
  id: string
  name: string
  description?: string
  members: GroupMember[]
  expenses: Expense[]
  inviteCode: string
  createdAt: Date
  createdBy: string
}

export interface GroupMember {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
  joinedAt: Date
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: Date
  category?: string
}

const GROUPS_STORAGE_KEY = "amigo-gastos-groups"

// Función para obtener todos los grupos
export function getGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error al obtener grupos:", error)
    return []
  }
}

// Función para guardar grupos
function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error al guardar grupos:", error)
  }
}

// Función para crear un grupo
export function createGroup(name: string, description: string, createdBy: string): Group {
  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    members: [],
    expenses: [],
    inviteCode: generateInviteCode(),
    createdAt: new Date(),
    createdBy,
  }

  const groups = getGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para obtener un grupo por ID
export function getGroupById(id: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.id === id) || null
}

// Función para obtener un grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Omit<GroupMember, "joinedAt">): boolean {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newMember: GroupMember = {
    ...member,
    joinedAt: new Date(),
  }

  groups[groupIndex].members.push(newMember)
  saveGroups(groups)

  return true
}

// Función para agregar un gasto
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id" | "date">): boolean {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    date: new Date(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return true
}

// Función para generar ID único
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Función para generar código de invitación
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
