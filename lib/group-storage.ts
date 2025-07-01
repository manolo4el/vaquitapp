export interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
  joinedAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: string
  category?: string
  receipt?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  createdBy: string
  inviteCode: string
}

// Mock storage
let groups: Group[] = []

export function getAllGroups(): Group[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("vaquitapp-groups")
    if (stored) {
      try {
        groups = JSON.parse(stored)
      } catch {
        groups = []
      }
    }
  }
  return groups
}

export function getUserGroups(): Group[] {
  const allGroups = getAllGroups()
  const currentUser = getCurrentUser()
  if (!currentUser) return []

  return allGroups.filter((group) => group.members.some((member) => member.id === currentUser.id))
}

export function getGroupById(id: string): Group | null {
  const allGroups = getAllGroups()
  return allGroups.find((group) => group.id === id) || null
}

export function getGroupByInviteCode(inviteCode: string): Group | null {
  const allGroups = getAllGroups()
  return allGroups.find((group) => group.inviteCode === inviteCode) || null
}

export function createGroup(name: string, description?: string): Group {
  const currentUser = getCurrentUser()
  if (!currentUser) throw new Error("No user logged in")

  const group: Group = {
    id: `group-${Date.now()}`,
    name,
    description,
    members: [
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        alias: currentUser.alias,
        joinedAt: new Date().toISOString(),
      },
    ],
    expenses: [],
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  }

  groups.push(group)
  saveGroups()

  return group
}

export function addMemberToGroup(groupId: string, member: Member): Group {
  const group = getGroupById(groupId)
  if (!group) throw new Error("Group not found")

  // Check if member already exists
  if (group.members.some((m) => m.id === member.id)) {
    throw new Error("Member already in group")
  }

  group.members.push({
    ...member,
    joinedAt: new Date().toISOString(),
  })

  saveGroups()
  return group
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Group {
  const group = getGroupById(groupId)
  if (!group) throw new Error("Group not found")

  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}`,
    date: expense.date || new Date().toISOString(),
  }

  group.expenses.push(newExpense)
  saveGroups()

  return group
}

function saveGroups(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("vaquitapp-groups", JSON.stringify(groups))
  }
}

function getCurrentUser() {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("vaquitapp-user")
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

// Additional utility functions
export function markTransferAsCompleted(fromUserId: string, toUserId: string, amount: number): void {
  // Mock implementation
  console.log(`Transfer marked as completed: ${fromUserId} -> ${toUserId}: $${amount}`)
}

export function markMultiGroupTransferAsCompleted(transfers: any[]): void {
  // Mock implementation
  console.log("Multi-group transfers marked as completed:", transfers)
}

export function addMessageToGroup(groupId: string, message: string): void {
  // Mock implementation
  console.log(`Message added to group ${groupId}:`, message)
}

export function getGroupMessages(groupId: string): any[] {
  // Mock implementation
  return []
}

export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  return group.members.some((member) => member.id === userId)
}
