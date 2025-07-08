"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Receipt, Bell, LogOut } from "lucide-react"
import { GroupCard } from "./group-card"
import { NotificationsDropdown } from "./notifications-dropdown"
import { useNotifications } from "@/hooks/use-notifications"
import { getUserDisplayName } from "@/lib/calculations"
import Image from "next/image"

interface Group {
  id: string
  name: string
  description?: string
  members: string[]
  createdBy: string
  createdAt: any
  currency: string
}

interface EnhancedDashboardProps {
  onNavigate: (page: string, groupId?: string) => void
}

export function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const { user, logout } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const { notifications, unreadCount } = useNotifications()

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[]

      setGroups(groupsData)

      // Cargar datos de todos los usuarios únicos de todos los grupos
      const allUserIds = new Set<string>()
      groupsData.forEach((group) => {
        group.members.forEach((memberId) => allUserIds.add(memberId))
        allUserIds.add(group.createdBy)
      })

      const usersDataMap: any = {}
      await Promise.all(
        Array.from(allUserIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              usersDataMap[userId] = userDoc.data()
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error)
          }
        }),
      )

      setUsersData(usersDataMap)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image src="/cow-logo.svg" alt="Vaquitapp" width={32} height={32} className="w-8 h-8" />
                <h1 className="text-xl font-bold text-gray-900">Vaquitapp</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationsDropdown />

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.displayName || user?.email}
                </span>
              </div>

              {/* Logout Button */}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Hola, {getUserDisplayName(user?.uid || "", { [user?.uid || ""]: user })}!
          </h2>
          <p className="text-gray-600">Gestiona tus gastos compartidos de manera fácil y transparente</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Crear Grupo</h3>
                  <p className="text-sm text-gray-600">Nuevo grupo de gastos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate("user-profile")}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mi Perfil</h3>
                  <p className="text-sm text-gray-600">Configurar cuenta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate("debt-consolidation")}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Consolidar</h3>
                  <p className="text-sm text-gray-600">Ver todas las deudas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Mis Grupos</h3>
            <Badge variant="secondary" className="text-sm">
              {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
            </Badge>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No tienes grupos aún</h4>
                <p className="text-gray-600 mb-4">Crea tu primer grupo para empezar a dividir gastos con tus amigos</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Grupo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} usersData={usersData} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {notifications.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Actividad Reciente</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length > 3 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="w-full">
                      Ver todas las notificaciones
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
