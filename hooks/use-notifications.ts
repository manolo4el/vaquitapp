"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export interface Notification {
  id: string
  title: string
  message: string
  groupId: string
  groupName: string
  timestamp: Date
  read: boolean
  type: "expense_added" | "payment_request" | "group_invite" | "debt_settled"
}

// Datos de ejemplo - en producción esto vendría de Firebase
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Nuevo gasto agregado",
    message: "Juan agregó un gasto de $15.000 en 'Viaje a Bariloche'",
    groupId: "group1",
    groupName: "Viaje a Bariloche",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    read: false,
    type: "expense_added",
  },
  {
    id: "2",
    title: "Solicitud de pago",
    message: "María te solicita el pago de $8.500",
    groupId: "group2",
    groupName: "Cena de amigos",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    read: false,
    type: "payment_request",
  },
  {
    id: "3",
    title: "Invitación a grupo",
    message: "Carlos te invitó al grupo 'Asado del domingo'",
    groupId: "group3",
    groupName: "Asado del domingo",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
    read: false,
    type: "group_invite",
  },
  {
    id: "4",
    title: "Deuda saldada",
    message: "Ana confirmó el pago de $12.000",
    groupId: "group1",
    groupName: "Viaje a Bariloche",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 días atrás
    read: true,
    type: "debt_settled",
  },
]

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      // Simular carga de notificaciones
      setTimeout(() => {
        setNotifications(mockNotifications)
        setLoading(false)
      }, 500)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "expense_added":
        return "💰"
      case "payment_request":
        return "💳"
      case "group_invite":
        return "👥"
      case "debt_settled":
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

  // Ordenar por timestamp descendente (más nuevas primero)
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    notifications: sortedNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    formatTimeAgo,
  }
}
