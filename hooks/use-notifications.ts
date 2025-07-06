"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore"

export interface Notification {
  id: string
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
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    // Query para obtener notificaciones del usuario actual usando subcolección
    // /notifications/{userId}/items
    const notificationsQuery = query(collection(db, "notifications", user.uid, "items"), orderBy("createdAt", "desc"))

    // Listener en tiempo real
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: data.type,
            message: data.message,
            groupId: data.groupId,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Notification
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
  }, [user])

  const unreadCount = notifications.length

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      // Eliminar de la subcolección del usuario
      await deleteDoc(doc(db, "notifications", user.uid, "items", notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      // Obtener todas las notificaciones del usuario y eliminarlas
      const notificationsQuery = query(collection(db, "notifications", user.uid, "items"))
      const snapshot = await getDocs(notificationsQuery)
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
