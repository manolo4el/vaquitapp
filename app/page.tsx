"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { useNavigation } from "@/hooks/use-navigation"

export default function Home() {
  const { user, loading } = useAuth()
  const { currentPage, currentGroupId, currentExpenseId, navigateTo } = useNavigation()
  const [invitationId, setInvitationId] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si hay un parámetro de invitación en la URL
    const urlParams = new URLSearchParams(window.location.search)
    const invitation = urlParams.get("invitation")
    const legacyJoin = urlParams.get("join") // Mantener compatibilidad con URLs antiguas

    if (invitation) {
      setInvitationId(invitation)
      navigateTo("group-join")
    } else if (legacyJoin) {
      // Para compatibilidad con URLs antiguas que usan groupId
      console.warn("Using legacy join URL format. Consider updating to invitation-based URLs.")
      setInvitationId(legacyJoin) // Temporalmente usar como invitationId
      navigateTo("group-join")
    }
  }, [navigateTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <EnhancedDashboard onNavigate={navigateTo} />
      case "group-details":
        return currentGroupId ? (
          <GroupDetailsPage groupId={currentGroupId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "add-expense":
        return currentGroupId ? (
          <AddExpensePage groupId={currentGroupId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "expense-detail":
        return currentGroupId && currentExpenseId ? (
          <ExpenseDetailPage groupId={currentGroupId} expenseId={currentExpenseId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "profile":
        return <UserProfilePage onNavigate={navigateTo} />
      case "group-join":
        return invitationId ? (
          <GroupJoinPage invitationId={invitationId} onNavigate={navigateTo} />
        ) : (
          <EnhancedDashboard onNavigate={navigateTo} />
        )
      case "debt-consolidation":
        return <DebtConsolidationPage onNavigate={navigateTo} />
      default:
        return <EnhancedDashboard onNavigate={navigateTo} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">{renderCurrentPage()}</div>
    </div>
  )
}
