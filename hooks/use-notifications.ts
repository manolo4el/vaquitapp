"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import type { Notification, NotificationData } from "@/types/notifications"

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]

      setNotifications(notificationsData)
      setUnreadCount(notificationsData.filter((n) => !n.isRead).length)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        isRead: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter((n) => !n.isRead)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { isRead: true })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const createNotification = async (userId: string, data: NotificationData) => {
    try {
      let title = ""
      let message = ""

      switch (data.type) {
        case "new_expense":
          title = "💸 Nuevo gasto agregado"
          message = `${data.triggerUserName} agregó un gasto en ${data.groupName}`
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
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}
