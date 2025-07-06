"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

type Page = "dashboard" | "group" | "add-expense" | "expense-detail" | "profile" | "join-group" | "debt-consolidation"

export default function App() {
  const { user, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState<string | null>(null)

  // Reset page when user changes
  useEffect(() => {
    if (!user) {
      setCurrentPage("dashboard")
      setSelectedGroupId(null)
      setSelectedExpenseId(null)
    }
  }, [user])

  if (!user) {
    return <LoginScreen />
  }

  const handleLogout = async () => {
    try {
      await logout()
      setCurrentPage("dashboard")
      setSelectedGroupId(null)
      setSelectedExpenseId(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const navigateToGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentPage("group")
  }

  const navigateToAddExpense = (groupId?: string) => {
    if (groupId) {
      setSelectedGroupId(groupId)
    }
    setCurrentPage("add-expense")
  }

  const navigateToExpenseDetail = (expenseId: string, groupId?: string) => {
    setSelectedExpenseId(expenseId)
    if (groupId) {
      setSelectedGroupId(groupId)
    }
    setCurrentPage("expense-detail")
  }

  const navigateToProfile = () => {
    setCurrentPage("profile")
  }

  const navigateToDashboard = () => {
    setCurrentPage("dashboard")
    setSelectedGroupId(null)
    setSelectedExpenseId(null)
  }

  const navigateToJoinGroup = (code?: string) => {
    if (code) {
      setJoinCode(code)
    }
    setCurrentPage("join-group")
  }

  const navigateToDebtConsolidation = () => {
    setCurrentPage("debt-consolidation")
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <EnhancedDashboard
            onNavigateToGroup={navigateToGroup}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateToJoinGroup={navigateToJoinGroup}
            onNavigateToDebtConsolidation={navigateToDebtConsolidation}
          />
        )
      case "group":
        return selectedGroupId ? (
          <GroupDetailsPage
            groupId={selectedGroupId}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateBack={navigateToDashboard}
          />
        ) : (
          <EnhancedDashboard
            onNavigateToGroup={navigateToGroup}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateToJoinGroup={navigateToJoinGroup}
            onNavigateToDebtConsolidation={navigateToDebtConsolidation}
          />
        )
      case "add-expense":
        return (
          <AddExpensePage
            groupId={selectedGroupId}
            onNavigateBack={() => {
              if (selectedGroupId) {
                setCurrentPage("group")
              } else {
                navigateToDashboard()
              }
            }}
            onExpenseAdded={(groupId) => {
              navigateToGroup(groupId)
            }}
          />
        )
      case "expense-detail":
        return selectedExpenseId ? (
          <ExpenseDetailPage
            expenseId={selectedExpenseId}
            groupId={selectedGroupId}
            onNavigateBack={() => {
              if (selectedGroupId) {
                setCurrentPage("group")
              } else {
                navigateToDashboard()
              }
            }}
          />
        ) : (
          <EnhancedDashboard
            onNavigateToGroup={navigateToGroup}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateToJoinGroup={navigateToJoinGroup}
            onNavigateToDebtConsolidation={navigateToDebtConsolidation}
          />
        )
      case "profile":
        return <UserProfilePage onNavigateBack={navigateToDashboard} />
      case "join-group":
        return (
          <GroupJoinPage initialCode={joinCode} onNavigateBack={navigateToDashboard} onGroupJoined={navigateToGroup} />
        )
      case "debt-consolidation":
        return <DebtConsolidationPage onNavigateBack={navigateToDashboard} />
      default:
        return (
          <EnhancedDashboard
            onNavigateToGroup={navigateToGroup}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateToJoinGroup={navigateToJoinGroup}
            onNavigateToDebtConsolidation={navigateToDebtConsolidation}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Vaquitapp</h1>
            </div>

            {/* Navegación central */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={navigateToDashboard}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Inicio</span>
              </Button>

              <Button
                variant={currentPage === "profile" ? "default" : "ghost"}
                size="sm"
                onClick={navigateToProfile}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </Button>
            </nav>

            {/* Acciones del usuario */}
            <div className="flex items-center space-x-2">
              {/* Notificaciones */}
              <NotificationsDropdown />

              {/* Navegación móvil */}
              <div className="md:hidden flex items-center space-x-1">
                <Button
                  variant={currentPage === "dashboard" ? "default" : "ghost"}
                  size="icon"
                  onClick={navigateToDashboard}
                >
                  <LogOut className="h-4 w-4" />
                </Button>

                <Button
                  variant={currentPage === "profile" ? "default" : "ghost"}
                  size="icon"
                  onClick={navigateToProfile}
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="pb-4">{renderPage()}</main>
    </div>
  )
}
