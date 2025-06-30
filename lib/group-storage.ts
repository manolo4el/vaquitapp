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
  category?: string
  date: Date
  createdAt: Date
}

// Clave para localStorage
const GROUPS_STORAGE_KEY = "amigo-gastos-groups"

// Función para obtener todos los grupos
export function getAllGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    if (!stored) return []

    const groups = JSON.parse(stored)
    // Convertir fechas de string a Date
    return groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      members: group.members.map((member: any) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
      })),
      expenses: group.expenses.map((expense: any) => ({
        ...expense,
        date: new Date(expense.date),
        createdAt: new Date(expense.createdAt),
      })),
    }))
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

// Función para crear un nuevo grupo
export function createGroup(name: string, description: string, createdBy: string): Group {
  const newGroup: Group = {
    id: "group-" + Date.now(),
    name,
    description,
    members: [],
    expenses: [],
    inviteCode: generateInviteCode(),
    createdAt: new Date(),
    createdBy,
  }

  const groups = getAllGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para obtener un grupo por ID
export function getGroupById(id: string): Group | null {
  const groups = getAllGroups()
  return groups.find((group) => group.id === id) || null
}

// Función para obtener un grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getAllGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Omit<GroupMember, "joinedAt">): Group | null {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const newMember: GroupMember = {
    ...member,
    joinedAt: new Date(),
  }

  groups[groupIndex].members.push(newMember)
  saveGroups(groups)

  return groups[groupIndex]
}

// Función para agregar un gasto a un grupo
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id" | "createdAt">): Group | null {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const newExpense: Expense = {
    ...expense,
    id: "expense-" + Date.now(),
    createdAt: new Date(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return groups[groupIndex]
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

// Función para obtener grupos donde el usuario es miembro
export function getUserGroups(userId: string): Group[] {
  const groups = getAllGroups()
  return groups.filter((group) => group.createdBy === userId || group.members.some((member) => member.id === userId))
}
