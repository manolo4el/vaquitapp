"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { FirebaseSetupInstructions } from "@/components/firebase-setup-instructions"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { AddExpensePage } from "@/components/add-expense-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { GroupDetailsPage } from "@/components/group-details-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { useNavigation } from "@/hooks/use-navigation"
import { Button } from "@/components/ui/button"
import { LogOut, RefreshCw, User } from "lucide-react"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from "react"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { useAnalytics } from "@/hooks/use-analytics"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export default function Page() {
  const { user, userProfile, logout, loading, authError } = useAuth()
  const { currentPage, selectedGroupId, selectedExpenseId, selectedInvitationId, navigateTo } = useNavigation()
  const { trackPageView, trackUserAction } = useAnalytics()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Verificar si hay un parámetro de invitación en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const invitationId = urlParams.get("invite")
    if (invitationId && user && currentPage !== "group-join") {
      navigateTo("group-join", invitationId)
    }
  }, [user, navigateTo, currentPage])

  // Limpiar el parámetro cuando se navega fuera de group-join
  useEffect(() => {
    if (currentPage !== "group-join") {
      // Limpiar la URL si no estamos en group-join
      const url = new URL(window.location.href)
      if (url.searchParams.has("invite")) {
        url.searchParams.delete("invite")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [currentPage])

  // Timeout para detectar si el loading se cuelga
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true)
        console.log("Loading timeout reached")
      }
    }, 15000)

    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if (user && currentPage) {
      trackPageView(currentPage)
    }
  }, [currentPage, user, trackPageView])

  useEffect(() => {
    if (user && !loading) {
      trackUserAction("login_success", {
        user_id: user.uid,
        login_method: "google",
      })
    }
  }, [user, loading, trackUserAction])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleNavigateToGroup = (groupId: string) => {
    navigateTo("group-details", groupId)
  }

  // Si está cargando por más de 15 segundos, mostrar opción de refresh
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <div className="animate-bounce">
              <Image src="/cow-logo.svg" alt="Loading" width={64} height={64} className="opacity-60" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-primary">¡Ups! Esto está tardando más de lo normal</h2>
            <p className="text-muted-foreground">La vaca se quedó dormida. Intentemos despertarla.</p>
            {authError && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">Error: {authError}</p>}
          </div>
          <Button onClick={handleRefresh} className="bg-primary hover:bg-primary/90">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar página
          </Button>
        </div>
      </div>
    )
  }

  // Loading normal - Logo centrado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-bounce">
              <Image src="/cow-logo.svg" alt="Loading" width={64} height={64} className="opacity-60" />
            </div>
          </div>
          <p className="text-muted-foreground">Cargando tu rebaño...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    )
  }

  // Si hay error de permisos (usuario logueado pero sin acceso a Firestore)
  if (user && !userProfile && authError?.includes("permission")) {
    return (
      <>
        <FirebaseSetupInstructions />
        <Toaster />
      </>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "add-expense":
        return selectedGroupId ? (
          <AddExpensePage groupId={selectedGroupId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "profile":
        return (
          <UserProfilePage
            onNavigate={navigateTo}
            returnTo={selectedInvitationId ? `group-join` : undefined}
            returnGroupId={selectedInvitationId}
          />
        )
      case "group-details":
        return selectedGroupId ? (
          <GroupDetailsPage groupId={selectedGroupId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "group-join":
        return selectedInvitationId ? (
          <GroupJoinPage invitationId={selectedInvitationId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "debt-consolidation":
        return <DebtConsolidationPage onNavigate={navigateTo} />
      case "expense-detail":
        return selectedGroupId && selectedExpenseId ? (
          <ExpenseDetailPage groupId={selectedGroupId} expenseId={selectedExpenseId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      default:
        return <EnhancedDashboard onNavigate={navigateTo} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
      <Toaster />

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-lg border-b border-primary/10 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                <Image
                  src="/cow-logo.svg"
                  alt="Vaquitapp"
                  width={24}
                  height={24}
                  className="filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Vaquitapp
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botón de Perfil */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo("profile")}
                className={`h-8 px-2 ${
                  currentPage === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <User className="h-4 w-4 mr-1" />
                <span className="text-xs">Perfil</span>
              </Button>

              {/* Dropdown de Notificaciones */}
              <NotificationsDropdown onNavigateToGroup={handleNavigateToGroup} />

              {/* Indicador de perfil incompleto */}
              {!userProfile?.paymentInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo("profile")}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-8"
                >
                  ⚠️
                </Button>
              )}

              {/* Botón de Salir */}
              <Button
                variant="outline"
                size="icon"
                onClick={logout}
                className="border-primary/20 hover:bg-primary/10 h-8 w-8 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto px-4 py-6">{renderCurrentPage()}</main>
    </div>
  )
}
