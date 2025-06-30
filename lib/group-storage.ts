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
  paidByName: string
  splitBetween: string[]
  date: Date
  category?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  members: User[]
  expenses: Expense[]
  createdBy: string
  createdAt: Date
  inviteCode?: string
}

export interface Transfer {
  id: string
  from: string
  to: string
  amount: number
  groupId: string
  completed: boolean
  date: Date
}

export interface MultiGroupTransfer {
  id: string
  from: string
  to: string
  amount: number
  groupIds: string[]
  completed: boolean
  date: Date
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  type: "message" | "expense" | "transfer" | "system"
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

export const addMemberToGroup = async (groupId: string, member: User): Promise<void> => {
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
    const group = await getGroup(groupId)
    if (!group) throw new Error("Group not found")

    const memberToRemove = group.members.find((m) => m.id === memberId)
    if (!memberToRemove) throw new Error("Member not found")

    const docRef = doc(db, "groups", groupId)
    await updateDoc(docRef, {
      members: arrayRemove(memberToRemove),
    })
  } catch (error) {
    console.error("Error removing member from group:", error)
    throw error
  }
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

// Messages
export const addMessageToGroup = async (message: Omit<GroupMessage, "id">): Promise<string> => {
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

// Utility functions
export const isUserMemberOfGroup = (group: Group, userId: string): boolean => {
  return group.members.some((member) => member.id === userId)
}

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const groups = await getGroups()
    return groups.filter((group) => isUserMemberOfGroup(group, userId))
  } catch (error) {
    console.error("Error getting user groups:", error)
    throw error
  }
}
