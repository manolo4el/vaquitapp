"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupsDashboard } from "@/components/groups-dashboard"
import { GroupDetailsPage } from "@/components/group-details-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, User, LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Image from "next/image"

type Page =
  | "dashboard"
  | "groups"
  | "group-details"
  | "add-expense"
  | "expense-detail"
  | "profile"
  | "join-group"
  | "debt-consolidation"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navigateToGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentPage("group-details")
  }

  const navigateToAddExpense = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentPage("add-expense")
  }

  const navigateToExpenseDetail = (expenseId: string, groupId: string) => {
    setSelectedExpenseId(expenseId)
    setSelectedGroupId(groupId)
    setCurrentPage("expense-detail")
  }

  const navigateToJoinGroup = (code: string) => {
    setJoinCode(code)
    setCurrentPage("join-group")
  }

  const navigateToDebtConsolidation = () => {
    setCurrentPage("debt-consolidation")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <EnhancedDashboard
            onNavigateToGroups={() => setCurrentPage("groups")}
            onNavigateToGroup={navigateToGroup}
            onNavigateToAddExpense={navigateToAddExpense}
            onNavigateToExpenseDetail={navigateToExpenseDetail}
            onNavigateToDebtConsolidation={navigateToDebtConsolidation}
          />
        )
      case "groups":
        return (
          <GroupsDashboard
            onNavigateToGroup={navigateToGroup}
            onNavigateToJoinGroup={navigateToJoinGroup}
            onBack={() => setCurrentPage("dashboard")}
          />
        )
      case "group-details":
        return selectedGroupId ? (
          <GroupDetailsPage
            groupId={selectedGroupId}
            onNavigateToAddExpense={() => navigateToAddExpense(selectedGroupId)}
            onNavigateToExpenseDetail={(expenseId) => navigateToExpenseDetail(expenseId, selectedGroupId)}
            onBack={() => setCurrentPage("groups")}
          />
        ) : null
      case "add-expense":
        return selectedGroupId ? (
          <AddExpensePage
            groupId={selectedGroupId}
            onBack={() => navigateToGroup(selectedGroupId)}
            onExpenseAdded={() => navigateToGroup(selectedGroupId)}
          />
        ) : null
      case "expense-detail":
        return selectedExpenseId && selectedGroupId ? (
          <ExpenseDetailPage
            expenseId={selectedExpenseId}
            groupId={selectedGroupId}
            onBack={() => navigateToGroup(selectedGroupId)}
          />
        ) : null
      case "profile":
        return <UserProfilePage onBack={() => setCurrentPage("dashboard")} />
      case "join-group":
        return joinCode ? (
          <GroupJoinPage
            joinCode={joinCode}
            onJoined={(groupId) => navigateToGroup(groupId)}
            onBack={() => setCurrentPage("groups")}
          />
        ) : null
      case "debt-consolidation":
        return <DebtConsolidationPage onBack={() => setCurrentPage("dashboard")} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          {/* Logo y Título */}
          <div className="flex items-center gap-2">
            <Image src="/cow-logo.svg" alt="Vaquitapp" width={32} height={32} className="h-8 w-8" />
            <span className="font-bold text-lg">Vaquitapp</span>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant={currentPage === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("dashboard")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
            <Button
              variant={currentPage === "profile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("profile")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Perfil
            </Button>
          </nav>

          {/* Acciones del Usuario */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <NotificationsDropdown />

            {/* Menú de Usuario Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Salir</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Menú Mobile */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                        <AvatarFallback className="text-xs">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.displayName || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentPage("dashboard")}>
                    <Home className="mr-2 h-4 w-4" />
                    Inicio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Salir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-6">{renderPage()}</main>
    </div>
  )
}
