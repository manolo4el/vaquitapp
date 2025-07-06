"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
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

    console.log("🔔 Setting up notifications listener for user:", user.uid)

    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log("📬 Notifications snapshot received:", snapshot.size, "notifications")

          const notificationsList: Notification[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            notificationsList.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Notification)
          })

          console.log("📋 Processed notifications:", notificationsList.length)
          setNotifications(notificationsList)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error("❌ Error fetching notifications:", err)
          setError("Error loading notifications")
          setLoading(false)
        },
      )

      return unsubscribe
    } catch (err) {
      console.error("❌ Error setting up notifications listener:", err)
      setError("Error setting up notifications")
      setLoading(false)
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("✅ Marking notification as read:", notificationId)
      await deleteDoc(doc(db, "notifications", notificationId))

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("❌ Error marking notification as read:", error)
    }
  }

  const createNotification = async (notificationData: Omit<NotificationData, "createdAt">) => {
    try {
      console.log("🔔 Creating notification:", notificationData)

      await addDoc(collection(db, "notifications"), {
        ...notificationData,
        createdAt: serverTimestamp(),
      })

      console.log("✅ Notification created successfully")
    } catch (error) {
      console.error("❌ Error creating notification:", error)
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
