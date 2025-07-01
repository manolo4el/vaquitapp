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
}

export interface GroupMember {
  uid: string
  email: string
  displayName?: string
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
}

export interface Debt {
  from: string
  to: string
  amount: number
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  type: "expense" | "payment" | "system"
}

// Mock storage functions
const STORAGE_KEY = "vaquitapp_groups"

function getStoredGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
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
      })),
    }))
  } catch (error) {
    console.error("Error getting stored groups:", error)
    return []
  }
}

function saveGroups(groups: Group[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
    } catch (error) {
      console.error("Error saving groups:", error)
    }
  }
}

export function createGroup(name: string, description: string, createdBy: string): Group {
  const groups = getStoredGroups()

  const newGroup: Group = {
    id: "group-" + Date.now(),
    name,
    description,
    members: [],
    expenses: [],
    createdAt: new Date(),
    createdBy,
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    currency: "USD",
  }

  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

export function getUserGroups(userId: string): Group[] {
  const groups = getStoredGroups()
  return groups.filter((group) => group.members.some((member) => member.uid === userId) || group.createdBy === userId)
}

export function getGroupById(groupId: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.id === groupId) || null
}

export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

export function getAllGroups(): Group[] {
  return getStoredGroups()
}

export function addMemberToGroup(groupId: string, member: GroupMember): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    return false
  }

  // Check if member already exists
  const existingMember = groups[groupIndex].members.find((m) => m.uid === member.uid)
  if (existingMember) {
    return false
  }

  groups[groupIndex].members.push(member)
  saveGroups(groups)
  return true
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Expense {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Group not found")
  }

  const newExpense: Expense = {
    ...expense,
    id: "expense-" + Date.now(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return newExpense
}

export function updateExpense(groupId: string, expenseId: string, updates: Partial<Expense>): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    return false
  }

  const expenseIndex = groups[groupIndex].expenses.findIndex((expense) => expense.id === expenseId)
  if (expenseIndex === -1) {
    return false
  }

  groups[groupIndex].expenses[expenseIndex] = {
    ...groups[groupIndex].expenses[expenseIndex],
    ...updates,
  }

  saveGroups(groups)
  return true
}

export function deleteExpense(groupId: string, expenseId: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    return false
  }

  groups[groupIndex].expenses = groups[groupIndex].expenses.filter((expense) => expense.id !== expenseId)
  saveGroups(groups)
  return true
}

export function markTransferAsCompleted(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
): boolean {
  // Mock implementation - in real app this would update the database
  console.log(`Transfer marked as completed: ${fromUserId} -> ${toUserId}: $${amount}`)
  return true
}

export function markMultiGroupTransferAsCompleted(
  transfers: Array<{ groupId: string; fromUserId: string; toUserId: string; amount: number }>,
): boolean {
  // Mock implementation
  console.log("Multi-group transfers marked as completed:", transfers)
  return true
}

export function addMessageToGroup(groupId: string, message: Omit<GroupMessage, "id">): boolean {
  // Mock implementation
  console.log("Message added to group:", groupId, message)
  return true
}

export function getGroupMessages(groupId: string): GroupMessage[] {
  // Mock implementation
  return []
}

export function isUserMemberOfGroup(userId: string, groupId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  return group.members.some((member) => member.uid === userId) || group.createdBy === userId
}
