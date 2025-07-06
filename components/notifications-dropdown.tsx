"use client"

import { Bell, X, Users, DollarSign, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationsDropdown() {
  const { notifications, loading, unreadCount, markAsRead } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense_added":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "added_to_group":
        return <Users className="h-4 w-4 text-blue-600" />
      case "debt_paid":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = (notificationId: string, groupId: string) => {
    markAsRead(notificationId)
    // Navigate to group (you can implement navigation here)
    window.location.href = `/groups/${groupId}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} nuevas</Badge>}
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No tienes notificaciones</div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleNotificationClick(notification.id, notification.groupId)}
                >
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground leading-tight">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{notification.groupName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
