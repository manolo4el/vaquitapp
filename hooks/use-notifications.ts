"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Notification {
  id: string
  userId: string
  type: "new_expense" | "added_to_group" | "payment_marked"
  message: string
  groupId: string
  createdAt: Date
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([])
      setLoading(false)
      return
    }

    // Query para obtener notificaciones del usuario actual
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    )

    // Listener en tiempo real
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData: Notification[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          notificationsData.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            message: data.message,
            groupId: data.groupId,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          })
        })

        setNotifications(notificationsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.uid])

  const unreadCount = notifications.length // Todas las notificaciones son "no leídas" hasta que se eliminan

  const markAsRead = async (notificationId: string) => {
    try {
      // Eliminar la notificación de Firestore
      await deleteDoc(doc(db, "notifications", notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.uid) return

    try {
      // Obtener todas las notificaciones del usuario
      const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", user.uid))

      const snapshot = await getDocs(notificationsQuery)

      // Eliminar todas las notificaciones
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error("Error deleting all notifications:", error)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_expense":
        return "💰"
      case "added_to_group":
        return "👥"
      case "payment_marked":
        return "✅"
      default:
        return "🔔"
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    formatTimeAgo,
  }
}
