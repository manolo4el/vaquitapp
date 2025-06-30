export interface Group {
  id: string
  name: string
  description?: string
  members: GroupMember[]
  expenses: Expense[]
  createdAt: Date
  inviteCode: string
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
  receipt?: string
}

export interface Transfer {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  groupId: string
  completed: boolean
  createdAt: Date
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  type: "text" | "system"
}

const GROUPS_STORAGE_KEY = "amigo-gastos-groups"
const TRANSFERS_STORAGE_KEY = "amigo-gastos-transfers"
const MESSAGES_STORAGE_KEY = "amigo-gastos-messages"

// Función para obtener todos los grupos
export function getAllGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    const groups = stored ? JSON.parse(stored) : []
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
    createdAt: new Date(),
    inviteCode: generateInviteCode(),
    createdBy,
  }

  const groups = getAllGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para generar código de invitación
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Función para obtener un grupo por ID
export function getGroupById(groupId: string): Group | null {
  const groups = getAllGroups()
  return groups.find((group) => group.id === groupId) || null
}

// Función para obtener un grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getAllGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Omit<GroupMember, "joinedAt">): boolean {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newMember: GroupMember = {
    ...member,
    joinedAt: new Date(),
  }

  // Verificar si el usuario ya es miembro
  const existingMember = groups[groupIndex].members.find((m) => m.id === member.id)
  if (existingMember) return false

  groups[groupIndex].members.push(newMember)
  saveGroups(groups)

  return true
}

// Función para agregar un gasto
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id" | "date">): boolean {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newExpense: Expense = {
    ...expense,
    id: "expense-" + Date.now(),
    date: new Date(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return true
}

// Función para obtener grupos de un usuario
export function getUserGroups(userId: string): Group[] {
  const groups = getAllGroups()
  return groups.filter((group) => group.members.some((member) => member.id === userId) || group.createdBy === userId)
}

// Función para verificar si un usuario es miembro de un grupo
export function isUserMemberOfGroup(userId: string, groupId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  return group.members.some((member) => member.id === userId) || group.createdBy === userId
}

// Funciones para transferencias
export function getAllTransfers(): Transfer[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(TRANSFERS_STORAGE_KEY)
    const transfers = stored ? JSON.parse(stored) : []
    return transfers.map((transfer: any) => ({
      ...transfer,
      createdAt: new Date(transfer.createdAt),
    }))
  } catch (error) {
    console.error("Error al obtener transferencias:", error)
    return []
  }
}

function saveTransfers(transfers: Transfer[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers))
  } catch (error) {
    console.error("Error al guardar transferencias:", error)
  }
}

export function createTransfer(fromUserId: string, toUserId: string, amount: number, groupId: string): Transfer {
  const newTransfer: Transfer = {
    id: "transfer-" + Date.now(),
    fromUserId,
    toUserId,
    amount,
    groupId,
    completed: false,
    createdAt: new Date(),
  }

  const transfers = getAllTransfers()
  transfers.push(newTransfer)
  saveTransfers(transfers)

  return newTransfer
}

export function markTransferAsCompleted(transferId: string): boolean {
  const transfers = getAllTransfers()
  const transferIndex = transfers.findIndex((t) => t.id === transferId)

  if (transferIndex === -1) return false

  transfers[transferIndex].completed = true
  saveTransfers(transfers)

  return true
}

export function markMultiGroupTransferAsCompleted(transferIds: string[]): boolean {
  const transfers = getAllTransfers()
  let updated = false

  transferIds.forEach((transferId) => {
    const transferIndex = transfers.findIndex((t) => t.id === transferId)
    if (transferIndex !== -1) {
      transfers[transferIndex].completed = true
      updated = true
    }
  })

  if (updated) {
    saveTransfers(transfers)
  }

  return updated
}

// Funciones para mensajes
export function getAllMessages(): GroupMessage[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    const messages = stored ? JSON.parse(stored) : []
    return messages.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }))
  } catch (error) {
    console.error("Error al obtener mensajes:", error)
    return []
  }
}

function saveMessages(messages: GroupMessage[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch (error) {
    console.error("Error al guardar mensajes:", error)
  }
}

export function addMessageToGroup(
  groupId: string,
  userId: string,
  userName: string,
  message: string,
  type: "text" | "system" = "text",
): GroupMessage {
  const newMessage: GroupMessage = {
    id: "message-" + Date.now(),
    groupId,
    userId,
    userName,
    message,
    timestamp: new Date(),
    type,
  }

  const messages = getAllMessages()
  messages.push(newMessage)
  saveMessages(messages)

  return newMessage
}

export function getGroupMessages(groupId: string): GroupMessage[] {
  const messages = getAllMessages()
  return messages
    .filter((message) => message.groupId === groupId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Función para eliminar un grupo
export function deleteGroup(groupId: string): boolean {
  const groups = getAllGroups()
  const filteredGroups = groups.filter((group) => group.id !== groupId)

  if (filteredGroups.length === groups.length) return false

  saveGroups(filteredGroups)

  // También eliminar mensajes y transferencias relacionadas
  const messages = getAllMessages()
  const filteredMessages = messages.filter((message) => message.groupId !== groupId)
  saveMessages(filteredMessages)

  const transfers = getAllTransfers()
  const filteredTransfers = transfers.filter((transfer) => transfer.groupId !== groupId)
  saveTransfers(filteredTransfers)

  return true
}

// Función para actualizar un grupo
export function updateGroup(groupId: string, updates: Partial<Pick<Group, "name" | "description">>): boolean {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  groups[groupIndex] = { ...groups[groupIndex], ...updates }
  saveGroups(groups)

  return true
}
