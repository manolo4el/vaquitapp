import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import type { NotificationData } from "@/types/notifications"

export async function createNotificationForUsers(userIds: string[], data: NotificationData) {
  try {
    const promises = userIds.map(async (userId) => {
      // No crear notificación para el usuario que triggerea la acción
      if (userId === data.triggerUserId) return

      let title = ""
      let message = ""

      switch (data.type) {
        case "new_expense":
          title = "💸 Nuevo gasto agregado"
          message = `${data.triggerUserName} agregó "${data.expenseDescription}" en ${data.groupName}`
          break
        case "added_to_group":
          title = "📬 Te agregaron a un grupo"
          message = `${data.triggerUserName} te agregó al grupo ${data.groupName}`
          break
        case "debt_paid":
          title = "✅ Deuda marcada como pagada"
          message = `${data.triggerUserName} marcó como pagada una transferencia en ${data.groupName}`
          break
      }

      await addDoc(collection(db, "notifications"), {
        userId,
        type: data.type,
        title,
        message,
        groupId: data.groupId,
        groupName: data.groupName,
        triggerUserId: data.triggerUserId,
        triggerUserName: data.triggerUserName,
        expenseId: data.expenseId,
        amount: data.amount,
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })

    await Promise.all(promises)
    console.log(`Created notifications for ${userIds.length} users`)
  } catch (error) {
    console.error("Error creating notifications:", error)
  }
}

export async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.displayName || userData.email || "Usuario"
    }
    return "Usuario"
  } catch (error) {
    console.error("Error getting user display name:", error)
    return "Usuario"
  }
}
