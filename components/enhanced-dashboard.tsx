"use client"

import { useState, useEffect } from "react"
import { Plus, Users, Receipt, TrendingUp, User, Calculator, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { AddExpensePage } from "./add-expense-page"
import { GroupDetailsPage } from "./group-details-page"
import { UserProfilePage } from "./user-profile-page"
import { DebtConsolidationPage } from "./debt-consolidation-page"
import { NotificationsDropdown } from "./notifications-dropdown"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useNotifications } from "@/hooks/use-notifications"

interface Group {
  id: string
  name: string
  description: string
  members: any[]
  createdAt: any
  createdBy: string
}

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  paidBy: string
  groupId: string
  createdAt: any
}

export function EnhancedDashboard() {
  const { user, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const [currentView, setCurrentView] = useState<
    "dashboard" | "add-expense" | "group-details" | "profile" | "debt-consolidation"
  >("dashboard")
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load groups
      const groupsQuery = query(
        collection(db, "groups"),
        where("members", "array-contains", user.uid),
        orderBy("createdAt", "desc"),
      )
      const groupsSnapshot = await getDocs(groupsQuery)
      const groupsData = groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[]

      setGroups(groupsData)

      // Load recent expenses
      if (groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id)
        const expensesQuery = query(
          collection(db, "expenses"),
          where("groupId", "in", groupIds.slice(0, 10)), // Firestore limit
          orderBy("createdAt", "desc"),
          limit(5),
        )
        const expensesSnapshot = await getDocs(expensesQuery)
        const expensesData = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[]

        setRecentExpenses(expensesData)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group)
    setCurrentView("group-details")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setSelectedGroup(null)
    setMobileMenuOpen(false)
    loadDashboardData() // Refresh data when returning to dashboard
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: "🍕",
      transport: "🚗",
      entertainment: "🎬",
      shopping: "🛍️",
      utilities: "⚡",
      health: "🏥",
      general: "📝",
    }
    return icons[category] || "📝"
  }

  const totalExpenses = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (currentView === "add-expense") {
    return <AddExpensePage onBack={handleBackToDashboard} groups={groups} />
  }

  if (currentView === "group-details" && selectedGroup) {
    return <GroupDetailsPage group={selectedGroup} onBack={handleBackToDashboard} />
  }

  if (currentView === "profile") {
    return <UserProfilePage onBack={handleBackToDashboard} />
  }

  if (currentView === "debt-consolidation") {
    return <DebtConsolidationPage onBack={handleBackToDashboard} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl">🐮</span>
                <h1 className="ml-2 text-xl font-bold text-green-700">Vaquitapp</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <NotificationsDropdown />
              <Button variant="ghost" onClick={() => setCurrentView("profile")} className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{user?.displayName || "Usuario"}</span>
              </Button>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.displayName || "Usuario"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <NotificationsDropdown />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentView("profile")
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {user?.displayName?.split(" ")[0] || "Usuario"}! 👋
          </h2>
          <p className="text-gray-600">Gestiona tus gastos compartidos de forma fácil y rápida</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Grupos Activos</p>
                  <p className="text-2xl font-bold text-green-600">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gastos Recientes</p>
                  <p className="text-2xl font-bold text-blue-600">{recentExpenses.length}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-purple-600">${totalExpenses.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setCurrentView("debt-consolidation")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consolidar</p>
                  <p className="text-lg font-bold text-orange-600">Deudas</p>
                </div>
                <Calculator className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setCurrentView("add-expense")} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Agregar Gasto</span>
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("debt-consolidation")}>
              <Calculator className="h-4 w-4 mr-2" />
              Consolidar Deudas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Groups Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Mis Grupos</span>
                </span>
                <Badge variant="secondary">{groups.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No tienes grupos aún</p>
                  <Button variant="outline" size="sm">
                    Crear tu primer grupo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupClick(group)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-gray-500">{group.members.length} miembros</p>
                        </div>
                        <Badge variant="outline">{group.members.length}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5" />
                  <span>Gastos Recientes</span>
                </span>
                <Badge variant="secondary">{recentExpenses.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay gastos recientes</p>
                  <Button variant="outline" size="sm" onClick={() => setCurrentView("add-expense")}>
                    Agregar primer gasto
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-gray-500">
                            {expense.createdAt?.toDate?.()?.toLocaleDateString() || "Fecha no disponible"}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">${expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
