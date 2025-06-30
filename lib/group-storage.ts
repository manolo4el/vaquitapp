import type { Expense, Member } from "./expense-calculator"
import { getCurrentUser } from "./auth"

export interface Group {
  id: string
  name: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  inviteCode?: string
  transfers?: Transfer[]
  messages?: GroupMessage[]
}

export interface Transfer {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  markedAt: string
  markedBy: string
}

export interface GroupMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  groupId: string
}

// Clave para localStorage
const STORAGE_KEY = "amigo-gastos-groups"

// Inicializar localStorage vacío si no existe
if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
}

export function getAllGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error al cargar grupos:", error)
    return []
  }
}

export function getGroupById(id: string): Group | null {
  if (typeof window === "undefined") return null

  try {
    const groups = getAllGroups()
    const group = groups.find((group: Group) => group.id === id)

    if (group) {
      return syncMemberProfiles(group)
    }

    return null
  } catch (error) {
    console.error("Error al cargar grupo:", error)
    return null
  }
}

// Función para sincronizar perfiles de miembros
function syncMemberProfiles(group: Group): Group {
  const currentUser = getCurrentUser()

  if (currentUser) {
    const memberIndex = group.members.findIndex((m) => m.id === currentUser.id)
    if (memberIndex !== -1) {
      group.members[memberIndex] = {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        alias: currentUser.alias,
      }

      group.expenses = group.expenses.map((expense) => {
        if (expense.paidBy.id === currentUser.id) {
          expense.paidBy = { id: currentUser.id, name: currentUser.name }
        }
        return expense
      })

      saveGroup(group)
    }
  }

  return group
}

function saveGroup(group: Group): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === group.id)

  if (groupIndex !== -1) {
    groups[groupIndex] = group
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }
}

export function createGroup(name: string): Group {
  const groups = getAllGroups()
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error("Usuario no autenticado")
  }

  const inviteCode = generateInviteCode()

  const newGroup: Group = {
    id: Date.now().toString(),
    name: name.trim(),
    members: [
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        alias: currentUser.alias,
      },
    ],
    expenses: [],
    createdAt: new Date().toISOString(),
    inviteCode: inviteCode,
    transfers: [],
    messages: [],
  }

  groups.push(newGroup)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  return newGroup
}

export function getUserGroups(): Group[] {
  const currentUser = getCurrentUser()
  if (!currentUser) return []

  const allGroups = getAllGroups()
  return allGroups.filter((group) => group.members.some((member) => member.id === currentUser.id))
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const existingGroups = getAllGroups()
  const codeExists = existingGroups.some((group) => group.inviteCode === result)

  if (codeExists) {
    return generateInviteCode()
  }

  return result
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Expense {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  const newExpense: Expense = {
    ...expense,
    id: Date.now(),
  }

  groups[groupIndex].expenses.push(newExpense)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  return newExpense
}

export function addMemberToGroup(groupId: string, member: Member): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  const memberExists = groups[groupIndex].members.some((m) => m.id === member.id)
  if (!memberExists) {
    groups[groupIndex].members.push(member)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }
}

export function getGroupByInviteCode(code: string): Group | null {
  const groups = getAllGroups()
  return groups.find((group) => group.inviteCode === code) || null
}

export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false
  return group.members.some((m) => m.id === userId)
}

export function markTransferAsCompleted(groupId: string, fromUserId: string, toUserId: string, amount: number): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  const currentUser = getCurrentUser()
  if (!currentUser) {
    throw new Error("Usuario no autenticado")
  }

  const transfer: Transfer = {
    id: Date.now().toString(),
    fromUserId,
    toUserId,
    amount,
    markedAt: new Date().toISOString(),
    markedBy: currentUser.id,
  }

  if (!groups[groupIndex].transfers) {
    groups[groupIndex].transfers = []
  }
  groups[groupIndex].transfers!.push(transfer)

  const fromUser = groups[groupIndex].members.find((m) => m.id === fromUserId)
  const toUser = groups[groupIndex].members.find((m) => m.id === toUserId)

  if (fromUser && toUser) {
    const adjustmentExpense: Expense = {
      id: Date.now() + 1,
      title: `Transferencia: ${fromUser.name} → ${toUser.name}`,
      amount: amount,
      paidBy: { id: fromUserId, name: fromUser.name },
      splitBetween: [toUserId],
      date: new Date().toISOString(),
      description: `Transferencia marcada como completada`,
    }

    groups[groupIndex].expenses.push(adjustmentExpense)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

export async function markMultiGroupTransferAsCompleted(
  groupIds: string[],
  creditorId: string,
  amounts: number[],
): Promise<void> {
  const groups = getAllGroups()
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error("Usuario no autenticado")
  }

  for (let i = 0; i < groupIds.length; i++) {
    const groupId = groupIds[i]
    const amount = amounts[i]
    const groupIndex = groups.findIndex((g) => g.id === groupId)

    if (groupIndex === -1) {
      continue
    }

    const transfer: Transfer = {
      id: `${Date.now()}-${i}`,
      fromUserId: currentUser.id,
      toUserId: creditorId,
      amount,
      markedAt: new Date().toISOString(),
      markedBy: currentUser.id,
    }

    if (!groups[groupIndex].transfers) {
      groups[groupIndex].transfers = []
    }
    groups[groupIndex].transfers!.push(transfer)

    const creditor = groups[groupIndex].members.find((m) => m.id === creditorId)

    if (creditor) {
      const adjustmentExpense: Expense = {
        id: Date.now() + i + 1,
        title: `Liquidación consolidada: ${currentUser.name} → ${creditor.name}`,
        amount: amount,
        paidBy: { id: currentUser.id, name: currentUser.name },
        splitBetween: [creditorId],
        date: new Date().toISOString(),
        description: `Transferencia consolidada marcada como completada`,
      }

      groups[groupIndex].expenses.push(adjustmentExpense)
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

export function addMessageToGroup(groupId: string, message: string): GroupMessage {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  const currentUser = getCurrentUser()
  if (!currentUser) {
    throw new Error("Usuario no autenticado")
  }

  const isMember = groups[groupIndex].members.some((m) => m.id === currentUser.id)
  if (!isMember) {
    throw new Error("No eres miembro de este grupo")
  }

  const newMessage: GroupMessage = {
    id: Date.now().toString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    message: message.trim(),
    timestamp: new Date().toISOString(),
    groupId: groupId,
  }

  if (!groups[groupIndex].messages) {
    groups[groupIndex].messages = []
  }

  groups[groupIndex].messages!.push(newMessage)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  return newMessage
}

export function getGroupMessages(groupId: string): GroupMessage[] {
  const group = getGroupById(groupId)
  if (!group) return []

  const currentUser = getCurrentUser()
  if (!currentUser) return []

  const isMember = group.members.some((m) => m.id === currentUser.id)
  if (!isMember) return []

  return group.messages || []
}

export function clearAllData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  }
}
