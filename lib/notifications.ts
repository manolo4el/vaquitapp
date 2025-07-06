import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"

export interface CreateNotificationData {
  userId: string
  type: "new_expense" | "added_to_group" | "payment_marked"
  message: string
  groupId: string
}

export async function createNotification(data: CreateNotificationData) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: data.userId,
      type: data.type,
      message: data.message,
      groupId: data.groupId,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function createNotificationsForGroupMembers(
  groupId: string,
  excludeUserId: string,
  type: "new_expense" | "added_to_group" | "payment_marked",
  message: string,
) {
  try {
    // Obtener los miembros del grupo
    const groupDoc = await getDoc(doc(db, "groups", groupId))
    if (!groupDoc.exists()) return

    const groupData = groupDoc.data()
    const members = groupData.members || []

    // Crear notificaciones para todos los miembros excepto el que realizó la acción
    const notificationPromises = members
      .filter((memberId: string) => memberId !== excludeUserId)
      .map((memberId: string) =>
        createNotification({
          userId: memberId,
          type,
          message,
          groupId,
        }),
      )

    await Promise.all(notificationPromises)
  } catch (error) {
    console.error("Error creating notifications for group members:", error)
  }
}
