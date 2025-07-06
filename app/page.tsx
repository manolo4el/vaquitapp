"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { BottomNavigation } from "@/components/bottom-navigation"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import { useAnalytics } from "@/hooks/use-analytics"

export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null)
  const { trackPageView, trackUserAction } = useAnalytics()

  useEffect(() => {
    // Check for group join invitation in URL
    const urlParams = new URLSearchParams(window.location.search)
    const joinGroupId = urlParams.get("join")
    if (joinGroupId && user) {
      setCurrentPage("group-join")
      setCurrentGroupId(joinGroupId)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [user])

  useEffect(() => {
    trackPageView(currentPage, currentGroupId)
  }, [currentPage, currentGroupId, trackPageView])

  const handleNavigate = (page: string, groupId?: string, expenseId?: string) => {
    setCurrentPage(page)
    setCurrentGroupId(groupId || null)
    setCurrentExpenseId(expenseId || null)
  }

  const handleNavigateToGroup = (groupId: string) => {
    handleNavigate("group-details", groupId)
  }

  const handleLogout = async () => {
    trackUserAction("logout")
    await logout()
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <EnhancedDashboard onNavigate={handleNavigate} />
      case "group-details":
        return currentGroupId ? (
          <GroupDetailsPage groupId={currentGroupId} onNavigate={handleNavigate} />
        ) : (
          <EnhancedDashboard onNavigate={handleNavigate} />
        )
      case "add-expense":
        return currentGroupId ? (
          <AddExpensePage groupId={currentGroupId} onNavigate={handleNavigate} />
        ) : (
          <EnhancedDashboard onNavigate={handleNavigate} />
        )
      case "expense-detail":
        return currentGroupId && currentExpenseId ? (
          <ExpenseDetailPage groupId={currentGroupId} expenseId={currentExpenseId} onNavigate={handleNavigate} />
        ) : (
          <EnhancedDashboard onNavigate={handleNavigate} />
        )
      case "profile":
        return <UserProfilePage onNavigate={handleNavigate} />
      case "group-join":
        return currentGroupId ? (
          <GroupJoinPage groupId={currentGroupId} onNavigate={handleNavigate} />
        ) : (
          <EnhancedDashboard onNavigate={handleNavigate} />
        )
      case "debt-consolidation":
        return <DebtConsolidationPage onNavigate={handleNavigate} />
      default:
        return <EnhancedDashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🐄</div>
              <span className="font-bold text-primary text-lg">Vaquitapp</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationsDropdown onNavigateToGroup={handleNavigateToGroup} />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => handleNavigate("profile")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">{renderCurrentPage()}</main>

        {/* Bottom Navigation */}
        <BottomNavigation currentPage={currentPage} onNavigate={handleNavigate} />

        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
