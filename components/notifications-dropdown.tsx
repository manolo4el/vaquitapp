"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsDropdownProps {
  onNavigateToGroup: (groupId: string) => void
}

export function NotificationsDropdown({ onNavigateToGroup }: NotificationsDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    onNavigateToGroup(notification.groupId)
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await markAllAsRead()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border border-primary/20 hover:bg-primary/10"
        >
          <Bell className="h-4 w-4 text-primary" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[90vw]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`w-full p-3 ${!notification.isRead ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        !notification.isRead ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            !notification.isRead ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && <div className="h-1.5 w-1.5 bg-primary rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {notification.createdAt &&
                            formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {notification.groupName}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
