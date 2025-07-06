"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupsDashboard } from "@/components/groups-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { GroupChat } from "@/components/group-chat"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { UserIcon, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

export default function Page() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success("Sesión cerrada exitosamente")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast.error("Error al cerrar sesión")
    }
  }

  const handleNavigateToGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentPage("group-details")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <EnhancedDashboard
            onNavigateToGroups={() => setCurrentPage("groups")}
            onNavigateToProfile={() => setCurrentPage("profile")}
            onNavigateToDebts={() => setCurrentPage("debts")}
          />
        )
      case "groups":
        return (
          <GroupsDashboard
            onNavigateToGroup={(groupId) => {
              setSelectedGroupId(groupId)
              setCurrentPage("group-details")
            }}
            onNavigateToJoin={(code) => {
              setJoinCode(code)
              setCurrentPage("join-group")
            }}
            onNavigateBack={() => setCurrentPage("dashboard")}
          />
        )
      case "group-details":
        return (
          <GroupDetailsPage
            groupId={selectedGroupId!}
            onNavigateBack={() => setCurrentPage("groups")}
            onNavigateToAddExpense={() => setCurrentPage("add-expense")}
            onNavigateToExpenseDetail={(expenseId) => {
              setSelectedExpenseId(expenseId)
              setCurrentPage("expense-detail")
            }}
            onNavigateToChat={() => setCurrentPage("group-chat")}
          />
        )
      case "add-expense":
        return (
          <AddExpensePage
            groupId={selectedGroupId!}
            onNavigateBack={() => setCurrentPage("group-details")}
            onExpenseAdded={() => setCurrentPage("group-details")}
          />
        )
      case "expense-detail":
        return (
          <ExpenseDetailPage
            expenseId={selectedExpenseId!}
            groupId={selectedGroupId!}
            onNavigateBack={() => setCurrentPage("group-details")}
          />
        )
      case "profile":
        return <UserProfilePage onNavigateBack={() => setCurrentPage("dashboard")} />
      case "debts":
        return <DebtConsolidationPage onNavigateBack={() => setCurrentPage("dashboard")} />
      case "join-group":
        return (
          <GroupJoinPage
            joinCode={joinCode}
            onNavigateBack={() => setCurrentPage("groups")}
            onGroupJoined={(groupId) => {
              setSelectedGroupId(groupId)
              setCurrentPage("group-details")
            }}
          />
        )
      case "group-chat":
        return <GroupChat groupId={selectedGroupId!} onNavigateBack={() => setCurrentPage("group-details")} />
      default:
        return (
          <EnhancedDashboard
            onNavigateToGroups={() => setCurrentPage("groups")}
            onNavigateToProfile={() => setCurrentPage("profile")}
            onNavigateToDebts={() => setCurrentPage("debts")}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header de navegación */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          {/* Logo y nombre */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg">Vaquitapp</span>
          </div>

          {/* Navegación */}
          <div className="flex items-center space-x-2">
            {/* Botón de inicio */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage("dashboard")}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              {/* Placeholder for Home icon */}
            </Button>

            {/* Botón de perfil */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage("profile")}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <UserIcon className="h-4 w-4" />
            </Button>

            {/* Notificaciones */}
            <NotificationsDropdown onNavigateToGroup={handleNavigateToGroup} />

            {/* Indicador de perfil incompleto */}
            {(!user.displayName || !user.photoURL) && <span className="text-yellow-500 text-sm">⚠️</span>}

            {/* Botón de cerrar sesión */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">{renderCurrentPage()}</main>
    </div>
  )
}
