"use client"

import { useState } from "react"

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
import { RefreshCw } from "lucide-react"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { useAnalytics } from "@/hooks/use-analytics"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Page() {
  const { user, userProfile, logout, loading, authError } = useAuth()
  const { currentPage, selectedGroupId, selectedExpenseId, navigateTo } = useNavigation()
  const { trackPageView, trackUserAction } = useAnalytics()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [joinInvitationId, setJoinInvitationId] = useState<string | null>(null)

  // Verificar si hay un parámetro de grupo en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const invitationId = urlParams.get("join")
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
      if (url.searchParams.has("join")) {
        url.searchParams.delete("join")
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {currentPage === "dashboard" && <EnhancedDashboard onNavigate={navigateTo} />}
        {currentPage === "add-expense" && selectedGroupId && (
          <AddExpensePage groupId={selectedGroupId} onNavigate={navigateTo} />
        )}
        {currentPage === "profile" && <UserProfilePage onNavigate={navigateTo} />}
        {currentPage === "group-details" && selectedGroupId && (
          <GroupDetailsPage groupId={selectedGroupId} onNavigate={navigateTo} />
        )}
        {currentPage === "group-join" && joinInvitationId && (
          <GroupJoinPage invitationId={joinInvitationId} onNavigate={navigateTo} />
        )}
        {currentPage === "debt-consolidation" && <DebtConsolidationPage onNavigate={navigateTo} />}
        {currentPage === "expense-detail" && selectedGroupId && selectedExpenseId && (
          <ExpenseDetailPage groupId={selectedGroupId} expenseId={selectedExpenseId} onNavigate={navigateTo} />
        )}
      </div>
    </ErrorBoundary>
  )
}
