export interface GroupMember {
  id: string
  name: string
  email: string
  avatar?: string
  alias: string
  joinedAt: Date
  isActive: boolean
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
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  description?: string
  members: GroupMember[]
  expenses: Expense[]
  createdAt: Date
  createdBy: string
  inviteCode: string
  currency: string
  messages: GroupMessage[]
}

export interface Transfer {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  description: string
  date: Date
  completed: boolean
  groupId: string
}

export interface MultiGroupTransfer {
  id: string
  fromUserId: string
  transfers: {
    toUserId: string
    amount: number
    groupId: string
  }[]
  description: string
  date: Date
  completed: boolean
}

export interface GroupMessage {
  id: string
  type: "expense" | "payment" | "member_joined" | "member_left" | "system"
  content: string
  userId?: string
  userName?: string
  timestamp: Date
  metadata?: any
}

// Storage keys
const GROUPS_STORAGE_KEY = "amigo-gastos-groups"
const TRANSFERS_STORAGE_KEY = "amigo-gastos-transfers"
const MULTI_TRANSFERS_STORAGE_KEY = "amigo-gastos-multi-transfers"

// Helper functions
function getStoredGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    if (!stored) return []

    const groups = JSON.parse(stored)
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
      messages:
        group.messages?.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp),
        })) || [],
    }))
  } catch (error) {
    console.error("Error getting stored groups:", error)
    return []
  }
}

function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error saving groups:", error)
  }
}

function getStoredTransfers(): Transfer[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(TRANSFERS_STORAGE_KEY)
    if (!stored) return []

    const transfers = JSON.parse(stored)
    return transfers.map((transfer: any) => ({
      ...transfer,
      date: new Date(transfer.date),
    }))
  } catch (error) {
    console.error("Error getting stored transfers:", error)
    return []
  }
}

function saveTransfers(transfers: Transfer[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers))
  } catch (error) {
    console.error("Error saving transfers:", error)
  }
}

function getStoredMultiTransfers(): MultiGroupTransfer[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(MULTI_TRANSFERS_STORAGE_KEY)
    if (!stored) return []

    const transfers = JSON.parse(stored)
    return transfers.map((transfer: any) => ({
      ...transfer,
      date: new Date(transfer.date),
    }))
  } catch (error) {
    console.error("Error getting stored multi transfers:", error)
    return []
  }
}

function saveMultiTransfers(transfers: MultiGroupTransfer[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(MULTI_TRANSFERS_STORAGE_KEY, JSON.stringify(transfers))
  } catch (error) {
    console.error("Error saving multi transfers:", error)
  }
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

// Required exports for compatibility
export function getAllGroups(): Group[] {
  return getStoredGroups()
}

export function getGroupById(groupId: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.id === groupId) || null
}

export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

export function getUserGroups(userId: string): Group[] {
  const groups = getStoredGroups()
  return groups.filter((group) => group.members.some((member) => member.id === userId && member.isActive))
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id" | "createdAt">): Expense {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: new Date(),
  }

  groups[groupIndex].expenses.push(newExpense)

  // Add expense message
  const payer = groups[groupIndex].members.find((member) => member.id === expense.paidBy)
  groups[groupIndex].messages.push({
    id: generateId(),
    type: "expense",
    content: `${payer?.name || "Alguien"} agregó un gasto: ${expense.description} - $${expense.amount}`,
    userId: expense.paidBy,
    userName: payer?.name,
    timestamp: new Date(),
    metadata: { expenseId: newExpense.id },
  })

  saveGroups(groups)
  return newExpense
}

// Group management functions
export function createGroup(
  name: string,
  description: string,
  createdBy: string,
  creatorName: string,
  creatorEmail: string,
  creatorAlias: string,
): Group {
  const groups = getStoredGroups()

  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    members: [
      {
        id: createdBy,
        name: creatorName,
        email: creatorEmail,
        alias: creatorAlias,
        joinedAt: new Date(),
        isActive: true,
      },
    ],
    expenses: [],
    createdAt: new Date(),
    createdBy,
    inviteCode: generateInviteCode(),
    currency: "ARS",
    messages: [
      {
        id: generateId(),
        type: "system",
        content: `${creatorName} creó el grupo`,
        timestamp: new Date(),
      },
    ],
  }

  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

export function joinGroup(
  groupId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAlias: string,
): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const group = groups[groupIndex]

  // Check if user is already a member
  const existingMember = group.members.find((member) => member.id === userId)
  if (existingMember) {
    if (!existingMember.isActive) {
      existingMember.isActive = true
      existingMember.joinedAt = new Date()
    }
  } else {
    group.members.push({
      id: userId,
      name: userName,
      email: userEmail,
      alias: userAlias,
      joinedAt: new Date(),
      isActive: true,
    })
  }

  // Add system message
  group.messages.push({
    id: generateId(),
    type: "member_joined",
    content: `${userName} se unió al grupo`,
    timestamp: new Date(),
  })

  saveGroups(groups)
  return true
}

export function leaveGroup(groupId: string, userId: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const group = groups[groupIndex]
  const memberIndex = group.members.findIndex((member) => member.id === userId)

  if (memberIndex === -1) return false

  const member = group.members[memberIndex]
  member.isActive = false

  // Add system message
  group.messages.push({
    id: generateId(),
    type: "member_left",
    content: `${member.name} abandonó el grupo`,
    timestamp: new Date(),
  })

  saveGroups(groups)
  return true
}

export function deleteExpense(groupId: string, expenseId: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const group = groups[groupIndex]
  const expenseIndex = group.expenses.findIndex((expense) => expense.id === expenseId)

  if (expenseIndex === -1) return false

  group.expenses.splice(expenseIndex, 1)
  saveGroups(groups)
  return true
}

export function updateGroupName(groupId: string, newName: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  groups[groupIndex].name = newName
  saveGroups(groups)
  return true
}

export function regenerateInviteCode(groupId: string): string | null {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const newInviteCode = generateInviteCode()
  groups[groupIndex].inviteCode = newInviteCode
  saveGroups(groups)
  return newInviteCode
}

// Transfer functions
export function createTransfer(
  fromUserId: string,
  toUserId: string,
  amount: number,
  description: string,
  groupId: string,
): Transfer {
  const transfers = getStoredTransfers()

  const newTransfer: Transfer = {
    id: generateId(),
    fromUserId,
    toUserId,
    amount,
    description,
    date: new Date(),
    completed: false,
    groupId,
  }

  transfers.push(newTransfer)
  saveTransfers(transfers)

  return newTransfer
}

export function markTransferAsCompleted(transferId: string): boolean {
  const transfers = getStoredTransfers()
  const transferIndex = transfers.findIndex((transfer) => transfer.id === transferId)

  if (transferIndex === -1) return false

  transfers[transferIndex].completed = true
  saveTransfers(transfers)
  return true
}

export function getUserTransfers(userId: string): Transfer[] {
  const transfers = getStoredTransfers()
  return transfers.filter((transfer) => transfer.fromUserId === userId || transfer.toUserId === userId)
}

export function getGroupTransfers(groupId: string): Transfer[] {
  const transfers = getStoredTransfers()
  return transfers.filter((transfer) => transfer.groupId === groupId)
}

// Multi-group transfer functions
export function createMultiGroupTransfer(
  fromUserId: string,
  transfers: { toUserId: string; amount: number; groupId: string }[],
  description: string,
): MultiGroupTransfer {
  const multiTransfers = getStoredMultiTransfers()

  const newMultiTransfer: MultiGroupTransfer = {
    id: generateId(),
    fromUserId,
    transfers,
    description,
    date: new Date(),
    completed: false,
  }

  multiTransfers.push(newMultiTransfer)
  saveMultiTransfers(multiTransfers)

  return newMultiTransfer
}

export function markMultiGroupTransferAsCompleted(transferId: string): boolean {
  const multiTransfers = getStoredMultiTransfers()
  const transferIndex = multiTransfers.findIndex((transfer) => transfer.id === transferId)

  if (transferIndex === -1) return false

  multiTransfers[transferIndex].completed = true
  saveMultiTransfers(multiTransfers)
  return true
}

export function getUserMultiGroupTransfers(userId: string): MultiGroupTransfer[] {
  const multiTransfers = getStoredMultiTransfers()
  return multiTransfers.filter(
    (transfer) => transfer.fromUserId === userId || transfer.transfers.some((t) => t.toUserId === userId),
  )
}

// Message functions
export function addMessageToGroup(groupId: string, message: Omit<GroupMessage, "id">): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newMessage: GroupMessage = {
    ...message,
    id: generateId(),
  }

  groups[groupIndex].messages.push(newMessage)
  saveGroups(groups)
  return true
}

export function getGroupMessages(groupId: string): GroupMessage[] {
  const group = getGroupById(groupId)
  return group?.messages || []
}

// Utility functions
export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  return group.members.some((member) => member.id === userId && member.isActive)
}

export function getGroupMemberById(groupId: string, memberId: string): GroupMember | null {
  const group = getGroupById(groupId)
  if (!group) return null

  return group.members.find((member) => member.id === memberId && member.isActive) || null
}

export function updateMemberAlias(groupId: string, memberId: string, newAlias: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const memberIndex = groups[groupIndex].members.findIndex((member) => member.id === memberId)
  if (memberIndex === -1) return false

  groups[groupIndex].members[memberIndex].alias = newAlias
  saveGroups(groups)
  return true
}

// Clear all data (for development/testing)
export function clearAllData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GROUPS_STORAGE_KEY)
    localStorage.removeItem(TRANSFERS_STORAGE_KEY)
    localStorage.removeItem(MULTI_TRANSFERS_STORAGE_KEY)
  }
}
