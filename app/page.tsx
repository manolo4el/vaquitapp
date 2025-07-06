"use client"
import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupsDashboard } from "@/components/groups-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { GroupChat } from "@/components/group-chat"
import { Button } from "@/components/ui/button"
import { HomeIcon, UserIcon, LogOutIcon } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useNavigation } from "@/hooks/use-navigation"

export default function Home() {
  const { user, logout, loading } = useAuth()
  const { currentPage, currentGroupId, currentExpenseId, navigateTo } = useNavigation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleNavigateToGroup = (groupId: string) => {
    navigateTo("group-details", groupId)
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

  const isProfileIncomplete = !user.paymentInfo || Object.keys(user.paymentInfo).length === 0

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <EnhancedDashboard />
      case "groups":
        return <GroupsDashboard />
      case "group-details":
        return <GroupDetailsPage groupId={currentGroupId!} />
      case "add-expense":
        return <AddExpensePage groupId={currentGroupId} />
      case "profile":
        return <UserProfilePage />
      case "expense-detail":
        return <ExpenseDetailPage expenseId={currentExpenseId!} />
      case "debt-consolidation":
        return <DebtConsolidationPage />
      case "group-join":
        return <GroupJoinPage />
      case "group-chat":
        return <GroupChat groupId={currentGroupId!} />
      default:
        return <EnhancedDashboard />
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
              onClick={() => navigateTo("dashboard")}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <HomeIcon className="h-4 w-4" />
            </Button>

            {/* Botón de perfil */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo("profile")}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <UserIcon className="h-4 w-4" />
            </Button>

            {/* Notificaciones */}
            <NotificationsDropdown onNavigateToGroup={handleNavigateToGroup} />

            {/* Indicador de perfil incompleto */}
            {isProfileIncomplete && (
              <span className="text-yellow-500 text-sm" title="Completa tu información de pago">
                ⚠️
              </span>
            )}

            {/* Botón de cerrar sesión */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">{renderContent()}</main>
    </div>
  )
}
