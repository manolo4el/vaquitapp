"use client"

import { Bell, X, Users, DollarSign, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { useNavigation } from "@/hooks/use-navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationsDropdown() {
  const { notifications, loading, unreadCount, markAsRead } = useNotifications()
  const { navigateToGroup } = useNavigation()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense_added":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "added_to_group":
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case "debt_paid":
        return <Users className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id)
    navigateToGroup(notification.groupId)
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

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} nuevas
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Cargando...</span>
            </div>
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex flex-col items-center py-4 text-center">
              <Bell className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">No hay notificaciones</span>
            </div>
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-blue-600 font-medium">{notification.groupName}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-gray-500">
              Y {notifications.length - 10} más...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
