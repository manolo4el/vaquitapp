import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore"

export interface Invitation {
  id: string
  groupId: string
  createdBy: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  usedBy?: string[]
}

export async function createGroupInvitation(groupId: string, createdBy: string): Promise<string> {
  try {
    // Crear invitación que expira en 30 días
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const invitationData = {
      groupId,
      createdBy,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      usedBy: [],
    }

    const docRef = await addDoc(collection(db, "invitations"), invitationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating invitation:", error)
    throw error
  }
}

// Alias para compatibilidad
export const createInvitation = createGroupInvitation

export async function getInvitationById(invitationId: string): Promise<Invitation | null> {
  try {
    const invitationDoc = await getDoc(doc(db, "invitations", invitationId))

    if (!invitationDoc.exists()) {
      return null
    }

    const data = invitationDoc.data()

    // Verificar si la invitación está activa y no ha expirado
    const now = new Date()
    const expiresAt = data.expiresAt.toDate()

    if (!data.isActive || now > expiresAt) {
      return null
    }

    return {
      id: invitationDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      expiresAt: data.expiresAt.toDate(),
    } as Invitation
  } catch (error) {
    console.error("Error getting invitation:", error)
    return null
  }
}

export async function markInvitationAsUsed(invitationId: string, userId: string): Promise<void> {
  try {
    const invitationRef = doc(db, "invitations", invitationId)
    const invitationDoc = await getDoc(invitationRef)

    if (!invitationDoc.exists()) return

    const data = invitationDoc.data()
    const usedBy = data.usedBy || []

    if (!usedBy.includes(userId)) {
      await updateDoc(invitationRef, {
        usedBy: [...usedBy, userId],
      })
    }
  } catch (error) {
    console.error("Error marking invitation as used:", error)
  }
}

export async function deactivateInvitation(invitationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "invitations", invitationId), {
      isActive: false,
    })
  } catch (error) {
    console.error("Error deactivating invitation:", error)
  }
}
