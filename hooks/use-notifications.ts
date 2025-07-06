"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import type { Notification, NotificationData } from "@/types/notifications"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    console.log("🔔 Configurando listener de notificaciones para usuario:", user.uid)

    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📬 Notificaciones recibidas:", snapshot.size)

        const notificationsList: Notification[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 Datos de notificación:", data)

          notificationsList.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            groupId: data.groupId,
            groupName: data.groupName,
            createdAt: data.createdAt?.toDate() || new Date(),
            read: data.read || false,
            expenseId: data.expenseId,
            amount: data.amount,
          })
        })

        setNotifications(notificationsList)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("❌ Error obteniendo notificaciones:", err)
        setError("Error al cargar notificaciones")
        setLoading(false)
      },
    )

    return () => {
      console.log("🔕 Desconectando listener de notificaciones")
      unsubscribe()
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("✅ Marcando notificación como leída:", notificationId)
      await deleteDoc(doc(db, "notifications", notificationId))
    } catch (error) {
      console.error("❌ Error marcando notificación como leída:", error)
    }
  }

  const createNotification = async (notificationData: Omit<NotificationData, "createdAt">) => {
    try {
      console.log("📝 Creando notificación:", notificationData)

      const docData = {
        ...notificationData,
        createdAt: Timestamp.now(),
        read: false,
      }

      await addDoc(collection(db, "notifications"), docData)
      console.log("✅ Notificación creada exitosamente")
    } catch (error) {
      console.error("❌ Error creando notificación:", error)
      throw error
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    createNotification,
  }
}
