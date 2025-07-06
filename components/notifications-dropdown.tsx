"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsDropdownProps {
  onNavigateToGroup: (groupId: string) => void
}

export function NotificationsDropdown({ onNavigateToGroup }: NotificationsDropdownProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = async (notificationId: string, groupId: string) => {
    await markAsRead(notificationId)
    onNavigateToGroup(groupId)
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense_added":
        return "💸"
      case "added_to_group":
        return "📬"
      case "debt_paid":
        return "✅"
      default:
        return "🔔"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs hover:bg-primary/10 text-primary"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-4xl mb-2">🔔</div>
                <div className="text-sm text-muted-foreground">No tienes notificaciones</div>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
                      onClick={() => handleNotificationClick(notification.id, notification.groupId)}
                    >
                      <div className="text-lg flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-primary mb-1">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{notification.message}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-accent-foreground font-medium">{notification.groupName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                              locale: es,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
