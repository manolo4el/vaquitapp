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
  writeBatch,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import type { Notification } from "@/types/notifications"

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

    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        notificationsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification)
      })
      setNotifications(notificationsList)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.delete(notificationRef)
      })
      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const createNotification = async (
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    groupId: string,
    groupName: string,
    createdBy?: string,
    createdByName?: string,
  ) => {
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        type,
        title,
        message,
        groupId,
        groupName,
        createdBy,
        createdByName,
        createdAt: Timestamp.now(),
        read: false,
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}
