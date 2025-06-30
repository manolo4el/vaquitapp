import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface User {
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
  date: Date
  category?: string
  receipt?: string
  createdAt: Date
}

export interface GroupMember {
  id: string
  name: string
  email: string
  avatar?: string
  alias: string
  joinedAt: Date
  isActive: boolean
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

export interface DebtSummary {
  owes: { [userId: string]: number }
  owedBy: { [userId: string]: number }
  netBalance: number
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

// Groups
export const createGroup = async (group: Omit<Group, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "groups"), {
      ...group,
      createdAt: Timestamp.fromDate(group.createdAt),
      expenses: group.expenses.map((expense) => ({
        ...expense,
        date: Timestamp.fromDate(expense.date),
        createdAt: Timestamp.fromDate(expense.createdAt),
      })),
      messages: group.messages.map((message) => ({
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
      })),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

export const getGroups = async (): Promise<Group[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "groups"))
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expenses:
          data.expenses?.map((expense: any) => ({
            ...expense,
            date: expense.date?.toDate() || new Date(),
            createdAt: expense.createdAt?.toDate() || new Date(),
          })) || [],
        messages:
          data.messages?.map((message: any) => ({
            ...message,
            timestamp: message.timestamp?.toDate() || new Date(),
          })) || [],
      } as Group
    })
  } catch (error) {
    console.error("Error getting groups:", error)
    throw error
  }
}

export const getGroup = async (id: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, "groups", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expenses:
          data.expenses?.map((expense: any) => ({
            ...expense,
            date: expense.date?.toDate() || new Date(),
            createdAt: expense.createdAt?.toDate() || new Date(),
          })) || [],
        messages:
          data.messages?.map((message: any) => ({
            ...message,
            timestamp: message.timestamp?.toDate() || new Date(),
          })) || [],
      } as Group
    }
    return null
  } catch (error) {
    console.error("Error getting group:", error)
    throw error
  }
}

export const updateGroup = async (id: string, updates: Partial<Group>): Promise<void> => {
  try {
    const docRef = doc(db, "groups", id)
    const updateData = { ...updates }

    if (updates.expenses) {
      updateData.expenses = updates.expenses.map((expense) => ({
        ...expense,
        date: Timestamp.fromDate(expense.date),
        createdAt: Timestamp.fromDate(expense.createdAt),
      }))
    }

    if (updates.messages) {
      updateData.messages = updates.messages.map((message) => ({
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
      }))
    }

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error("Error updating group:", error)
    throw error
  }
}

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "groups", id))
  } catch (error) {
    console.error("Error deleting group:", error)
    throw error
  }
}

export const addMemberToGroup = async (groupId: string, member: GroupMember): Promise<void> => {
  try {
    const docRef = doc(db, "groups", groupId)
    await updateDoc(docRef, {
      members: arrayUnion(member),
    })
  } catch (error) {
    console.error("Error adding member to group:", error)
    throw error
  }
}

export const removeMemberFromGroup = async (groupId: string, memberId: string): Promise<void> => {
  try {
    const docRef = doc(db, "groups", groupId)
    await updateDoc(docRef, {
      members: arrayRemove(memberId),
    })
  } catch (error) {
    console.error("Error removing member from group:", error)
    throw error
  }
}

export function createGroupLocal(
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

export function getGroupByInviteCodeLocal(inviteCode: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

export function getGroupByIdLocal(groupId: string): Group | null {
  const groups = getStoredGroups()
  return groups.find((group) => group.id === groupId) || null
}

export function getUserGroupsLocal(userId: string): Group[] {
  const groups = getStoredGroups()
  return groups.filter((group) => group.members.some((member) => member.id === userId && member.isActive))
}

export function joinGroupLocal(
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

export function leaveGroupLocal(groupId: string, userId: string): boolean {
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

export function addExpenseLocal(
  groupId: string,
  description: string,
  amount: number,
  paidBy: string,
  splitBetween: string[],
  category?: string,
): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const group = groups[groupIndex]
  const payer = group.members.find((member) => member.id === paidBy)

  const newExpense: Expense = {
    id: generateId(),
    description,
    amount,
    paidBy,
    splitBetween,
    date: new Date(),
    category,
    createdAt: new Date(),
  }

  group.expenses.push(newExpense)

  // Add expense message
  group.messages.push({
    id: generateId(),
    type: "expense",
    content: `${payer?.name || "Alguien"} agregó un gasto: ${description} - $${amount}`,
    userId: paidBy,
    userName: payer?.name,
    timestamp: new Date(),
    metadata: { expenseId: newExpense.id },
  })

  saveGroups(groups)
  return true
}

export function deleteExpenseLocal(groupId: string, expenseId: string): boolean {
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

export function updateGroupNameLocal(groupId: string, newName: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  groups[groupIndex].name = newName
  saveGroups(groups)
  return true
}

export function regenerateInviteCodeLocal(groupId: string): string | null {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const newInviteCode = generateInviteCode()
  groups[groupIndex].inviteCode = newInviteCode
  saveGroups(groups)
  return newInviteCode
}

// Transfers
export const createTransfer = async (transfer: Omit<Transfer, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "transfers"), {
      ...transfer,
      date: Timestamp.fromDate(transfer.date),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating transfer:", error)
    throw error
  }
}

export const getTransfers = async (): Promise<Transfer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "transfers"))
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
      } as Transfer
    })
  } catch (error) {
    console.error("Error getting transfers:", error)
    throw error
  }
}

export const markTransferAsCompleted = async (transferId: string): Promise<void> => {
  try {
    const docRef = doc(db, "transfers", transferId)
    await updateDoc(docRef, {
      completed: true,
    })
  } catch (error) {
    console.error("Error marking transfer as completed:", error)
    throw error
  }
}

export function createTransferLocal(
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

export function markTransferAsCompletedLocal(transferId: string): boolean {
  const transfers = getStoredTransfers()
  const transferIndex = transfers.findIndex((transfer) => transfer.id === transferId)

  if (transferIndex === -1) return false

  transfers[transferIndex].completed = true
  saveTransfers(transfers)
  return true
}

export function getUserTransfersLocal(userId: string): Transfer[] {
  const transfers = getStoredTransfers()
  return transfers.filter((transfer) => transfer.fromUserId === userId || transfer.toUserId === userId)
}

export function getGroupTransfersLocal(groupId: string): Transfer[] {
  const transfers = getStoredTransfers()
  return transfers.filter((transfer) => transfer.groupId === groupId)
}

// Multi-group transfers
export const createMultiGroupTransfer = async (transfer: Omit<MultiGroupTransfer, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "multiGroupTransfers"), {
      ...transfer,
      date: Timestamp.fromDate(transfer.date),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating multi-group transfer:", error)
    throw error
  }
}

export const getMultiGroupTransfers = async (): Promise<MultiGroupTransfer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "multiGroupTransfers"))
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
      } as MultiGroupTransfer
    })
  } catch (error) {
    console.error("Error getting multi-group transfers:", error)
    throw error
  }
}

export const markMultiGroupTransferAsCompleted = async (transferId: string): Promise<void> => {
  try {
    const docRef = doc(db, "multiGroupTransfers", transferId)
    await updateDoc(docRef, {
      completed: true,
    })
  } catch (error) {
    console.error("Error marking multi-group transfer as completed:", error)
    throw error
  }
}

export function createMultiGroupTransferLocal(
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

export function markMultiGroupTransferAsCompletedLocal(transferId: string): boolean {
  const multiTransfers = getStoredMultiTransfers()
  const transferIndex = multiTransfers.findIndex((transfer) => transfer.id === transferId)

  if (transferIndex === -1) return false

  multiTransfers[transferIndex].completed = true
  saveMultiTransfers(multiTransfers)
  return true
}

export function getUserMultiGroupTransfersLocal(userId: string): MultiGroupTransfer[] {
  const multiTransfers = getStoredMultiTransfers()
  return multiTransfers.filter(
    (transfer) => transfer.fromUserId === userId || transfer.transfers.some((t) => t.toUserId === userId),
  )
}

// Messages
export const addMessageToGroup = async (groupId: string, message: Omit<GroupMessage, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "groupMessages"), {
      ...message,
      timestamp: Timestamp.fromDate(message.timestamp),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding message to group:", error)
    throw error
  }
}

export const getGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
  try {
    const q = query(collection(db, "groupMessages"), where("groupId", "==", groupId), orderBy("timestamp", "asc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as GroupMessage
    })
  } catch (error) {
    console.error("Error getting group messages:", error)
    throw error
  }
}

export function addMessageToGroupLocal(groupId: string, message: Omit<GroupMessage, "id">): boolean {
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

export function getGroupMessagesLocal(groupId: string): GroupMessage[] {
  const group = getGroupByIdLocal(groupId)
  return group?.messages || []
}

// Utility functions
export const isUserMemberOfGroup = async (groupId: string, userId: string): Promise<boolean> => {
  const group = await getGroup(groupId)
  if (!group) return false

  return group.members.some((member) => member.id === userId && member.isActive)
}

export const getGroupMemberById = async (groupId: string, memberId: string): Promise<GroupMember | null> => {
  const group = await getGroup(groupId)
  if (!group) return null

  return group.members.find((member) => member.id === memberId && member.isActive) || null
}

export const updateMemberAlias = async (groupId: string, memberId: string, newAlias: string): Promise<void> => {
  try {
    const docRef = doc(db, "groups", groupId)
    await updateDoc(docRef, {
      [`members.${memberId}.alias`]: newAlias,
    })
  } catch (error) {
    console.error("Error updating member alias:", error)
    throw error
  }
}

export function isUserMemberOfGroupLocal(groupId: string, userId: string): boolean {
  const group = getGroupByIdLocal(groupId)
  if (!group) return false

  return group.members.some((member) => member.id === userId && member.isActive)
}

export function getGroupMemberByIdLocal(groupId: string, memberId: string): GroupMember | null {
  const group = getGroupByIdLocal(groupId)
  if (!group) return null

  return group.members.find((member) => member.id === memberId && member.isActive) || null
}

export function updateMemberAliasLocal(groupId: string, memberId: string, newAlias: string): boolean {
  const groups = getStoredGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const memberIndex = groups[groupIndex].members.findIndex((member) => member.id === memberId)
  if (memberIndex === -1) return false

  groups[groupIndex].members[memberIndex].alias = newAlias
  saveGroups(groups)
  return true
}
