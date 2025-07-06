"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import type { Notification, CreateNotificationData } from "@/types/notifications"

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

    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("🔔 Notifications snapshot received:", snapshot.size, "notifications")

        const notificationsList: Notification[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
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
            paidBy: data.paidBy,
            paidTo: data.paidTo,
          })
        })

        setNotifications(notificationsList)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("🔔 Error fetching notifications:", err)
        setError("Error loading notifications")
        setLoading(false)
      },
    )

    return () => {
      console.log("🔔 Cleaning up notifications listener")
      unsubscribe()
    }
  }, [user])

  const createNotification = async (data: CreateNotificationData) => {
    try {
      console.log("🔔 Creating notification:", data)

      const notificationData = {
        ...data,
        createdAt: serverTimestamp(),
        read: false,
      }

      await addDoc(collection(db, "notifications"), notificationData)
      console.log("🔔 Notification created successfully")
    } catch (error) {
      console.error("🔔 Error creating notification:", error)
      throw error
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId))
      console.log("🔔 Notification marked as read (deleted):", notificationId)
    } catch (error) {
      console.error("🔔 Error marking notification as read:", error)
      throw error
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    createNotification,
    markAsRead,
  }
}
