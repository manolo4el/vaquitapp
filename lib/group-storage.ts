export interface Member {
  id: string
  name: string
  alias: string
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
  inviteCode: string
}

export interface Debt {
  from: string
  to: string
  amount: number
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
export function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error al guardar grupos:", error)
  }
}

// Función para obtener un grupo por ID
export function getGroup(id: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.id === id) || null
}

// Función para crear un nuevo grupo
export function createGroup(
  name: string,
  description: string,
  creatorId: string,
  creatorName: string,
  creatorAlias: string,
): Group {
  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    members: [
      {
        id: creatorId,
        name: creatorName,
        alias: creatorAlias,
      },
    ],
    expenses: [],
    createdAt: new Date().toISOString(),
    inviteCode: generateInviteCode(),
  }

  const groups = getGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Member): Group | null {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  // Verificar si el miembro ya existe
  const memberExists = groups[groupIndex].members.some((m) => m.id === member.id)
  if (memberExists) return groups[groupIndex]

  groups[groupIndex].members.push(member)
  saveGroups(groups)

  return groups[groupIndex]
}

// Función para agregar un gasto
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Group | null {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const newExpense: Expense = {
    ...expense,
    id: generateId(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return groups[groupIndex]
}

// Función para encontrar grupo por código de invitación
export function findGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
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

// Función para obtener grupos del usuario
export function getUserGroups(userId: string): Group[] {
  const groups = getGroups()
  return groups.filter((group) => group.members.some((member) => member.id === userId))
}

// Función para eliminar un grupo
export function deleteGroup(groupId: string): boolean {
  const groups = getGroups()
  const filteredGroups = groups.filter((group) => group.id !== groupId)

  if (filteredGroups.length === groups.length) {
    return false // Grupo no encontrado
  }

  saveGroups(filteredGroups)
  return true
}

// Función para actualizar un grupo
export function updateGroup(groupId: string, updates: Partial<Group>): Group | null {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  groups[groupIndex] = { ...groups[groupIndex], ...updates }
  saveGroups(groups)

  return groups[groupIndex]
}
