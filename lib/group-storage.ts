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

  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveGroups(groups: Group[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }
}

export async function createGroup(name: string, description: string, createdBy: string): Promise<Group> {
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

export async function getUserGroups(userId: string): Promise<Group[]> {
  const groups = getStoredGroups()
  return groups.filter((group) => group.members.some((member) => member.uid === userId) || group.createdBy === userId)
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const groups = getStoredGroups()
  return groups.find((group) => group.id === groupId) || null
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  const groups = getStoredGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

export async function getAllGroups(): Promise<Group[]> {
  return getStoredGroups()
}

export async function addMemberToGroup(groupId: string, member: GroupMember): Promise<void> {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Group not found")
  }

  // Check if member already exists
  const existingMember = groups[groupIndex].members.find((m) => m.uid === member.uid)
  if (existingMember) {
    throw new Error("Member already in group")
  }

  groups[groupIndex].members.push(member)
  saveGroups(groups)
}

export async function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Promise<Expense> {
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

export async function updateExpense(groupId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Group not found")
  }

  const expenseIndex = groups[groupIndex].expenses.findIndex((expense) => expense.id === expenseId)
  if (expenseIndex === -1) {
    throw new Error("Expense not found")
  }

  groups[groupIndex].expenses[expenseIndex] = {
    ...groups[groupIndex].expenses[expenseIndex],
    ...updates,
  }

  saveGroups(groups)
}

export async function deleteExpense(groupId: string, expenseId: string): Promise<void> {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Group not found")
  }

  groups[groupIndex].expenses = groups[groupIndex].expenses.filter((expense) => expense.id !== expenseId)
  saveGroups(groups)
}

export async function markTransferAsCompleted(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
): Promise<void> {
  // Mock implementation - in real app this would update the database
  console.log(`Transfer marked as completed: ${fromUserId} -> ${toUserId}: $${amount}`)
}

export async function markMultiGroupTransferAsCompleted(
  transfers: Array<{ groupId: string; fromUserId: string; toUserId: string; amount: number }>,
): Promise<void> {
  // Mock implementation
  console.log("Multi-group transfers marked as completed:", transfers)
}

export async function addMessageToGroup(groupId: string, message: Omit<GroupMessage, "id">): Promise<void> {
  // Mock implementation
  console.log("Message added to group:", groupId, message)
}

export async function getGroupMessages(groupId: string): Promise<GroupMessage[]> {
  // Mock implementation
  return []
}

export async function isUserMemberOfGroup(userId: string, groupId: string): Promise<boolean> {
  const group = await getGroupById(groupId)
  if (!group) return false

  return group.members.some((member) => member.uid === userId) || group.createdBy === userId
}
