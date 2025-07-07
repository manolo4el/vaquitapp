import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc, query, where, getDocs, limit } from "firebase/firestore"

export interface Invitation {
  id: string
  groupId: string
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
}

export async function createGroupInvitation(groupId: string, createdBy: string): Promise<string> {
  try {
    // Verificar si ya existe una invitación activa para este grupo
    const existingInvitationsQuery = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      where("isActive", "==", true),
      limit(1),
    )

    const existingInvitations = await getDocs(existingInvitationsQuery)

    // Si ya existe una invitación activa, devolver su ID
    if (!existingInvitations.empty) {
      return existingInvitations.docs[0].id
    }

    // Crear nueva invitación
    const invitationDoc = await addDoc(collection(db, "invitations"), {
      groupId,
      createdBy,
      createdAt: new Date(),
      isActive: true,
    })

    return invitationDoc.id
  } catch (error) {
    console.error("Error creating group invitation:", error)
    throw error
  }
}

export async function getInvitationById(invitationId: string): Promise<Invitation | null> {
  try {
    const invitationDoc = await getDoc(doc(db, "invitations", invitationId))

    if (!invitationDoc.exists()) {
      return null
    }

    return {
      id: invitationDoc.id,
      ...invitationDoc.data(),
    } as Invitation
  } catch (error) {
    console.error("Error getting invitation:", error)
    return null
  }
}

export async function getGroupByInvitationId(invitationId: string): Promise<any | null> {
  try {
    const invitation = await getInvitationById(invitationId)

    if (!invitation || !invitation.isActive) {
      return null
    }

    const groupDoc = await getDoc(doc(db, "groups", invitation.groupId))

    if (!groupDoc.exists()) {
      return null
    }

    return {
      id: groupDoc.id,
      ...groupDoc.data(),
    }
  } catch (error) {
    console.error("Error getting group by invitation:", error)
    return null
  }
}
