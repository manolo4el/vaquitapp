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
  const { currentPage, selectedGroupId, selectedExpenseId, navigateTo } = useNavigation()
  const { trackPageView, trackUserAction } = useAnalytics()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [joinInvitationId, setJoinInvitationId] = useState<string | null>(null)

  // Verificar si hay un parámetro de invitación en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const invitationId = urlParams.get("invite")
    if (invitationId && user && !joinInvitationId) {
      setJoinInvitationId(invitationId)
      navigateTo("group-join", invitationId)
    }
  }, [user, navigateTo, joinInvitationId])

  // Limpiar el parámetro cuando se navega fuera de group-join
  useEffect(() => {
    if (currentPage !== "group-join" && joinInvitationId) {
      setJoinInvitationId(null)
      // Limpiar la URL si no estamos en group-join
      const url = new URL(window.location.href)
      if (url.searchParams.has("invite")) {
        url.searchParams.delete("invite")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [currentPage, joinInvitationId])

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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <LoginScreen />
        <Toaster />
      </div>
    )
  }

  // Si hay error de autenticación, mostrar instrucciones de Firebase
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <FirebaseSetupInstructions />
        <Toaster />
      </div>
    )
  }

  // Header común para páginas autenticadas
  const renderHeader = () => {
    if (currentPage === "dashboard") {
      return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/cow-logo.svg" alt="Vaquitapp" width={32} height={32} className="opacity-80" />
                <div>
                  <h1 className="text-lg font-bold text-primary">Vaquitapp</h1>
                  <p className="text-xs text-muted-foreground">Tu rebaño financiero</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NotificationsDropdown />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateTo("profile")}
                  className="hover:bg-primary/10"
                >
                  {userProfile?.photoURL ? (
                    <Image
                      src={userProfile.photoURL || "/placeholder.svg"}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="hover:bg-destructive/10 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )
    }
    return null
  }

  // Renderizar contenido según la página actual
  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <EnhancedDashboard onNavigateToGroup={handleNavigateToGroup} />

      case "add-expense":
        return <AddExpensePage groupId={selectedGroupId!} onNavigate={navigateTo} />

      case "profile":
        return <UserProfilePage onNavigate={navigateTo} />

      case "group-details":
        return <GroupDetailsPage groupId={selectedGroupId!} onNavigate={navigateTo} />

      case "group-join":
        return <GroupJoinPage invitationId={joinInvitationId!} onNavigate={navigateTo} />

      case "debt-consolidation":
        return <DebtConsolidationPage onNavigate={navigateTo} />

      case "expense-detail":
        return <ExpenseDetailPage groupId={selectedGroupId!} expenseId={selectedExpenseId!} onNavigate={navigateTo} />

      default:
        return <EnhancedDashboard onNavigateToGroup={handleNavigateToGroup} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
      {renderHeader()}
      <main className="container mx-auto px-4 py-6 max-w-4xl">{renderContent()}</main>
      <Toaster />
    </div>
  )
}
