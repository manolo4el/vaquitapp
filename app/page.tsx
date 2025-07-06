"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { GroupsDashboard } from "@/components/groups-dashboard"
import { UserProfilePage } from "@/components/user-profile-page"
import { AddExpensePage } from "@/components/add-expense-page"
import { GroupDetailsPage } from "@/components/group-details-page"
import { ExpenseDetailPage } from "@/components/expense-detail-page"
import { GroupJoinPage } from "@/components/group-join-page"
import { DebtConsolidationPage } from "@/components/debt-consolidation-page"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserIcon, LogOutIcon, MenuIcon } from "lucide-react"
import { useState } from "react"
import { useNavigation } from "@/hooks/use-navigation"

export default function Page() {
  const { user, loading, signOut } = useAuth()
  const { currentPage, setCurrentPage, pageProps } = useNavigation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setCurrentPage("dashboard")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navigationItems = [
    { id: "dashboard", label: "Inicio", icon: UserIcon },
    { id: "profile", label: "Perfil", icon: UserIcon },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <EnhancedDashboard />
      case "groups":
        return <GroupsDashboard />
      case "profile":
        return <UserProfilePage />
      case "add-expense":
        return <AddExpensePage groupId={pageProps?.groupId} />
      case "group-details":
        return <GroupDetailsPage groupId={pageProps?.groupId} />
      case "expense-detail":
        return <ExpenseDetailPage expenseId={pageProps?.expenseId} />
      case "join-group":
        return <GroupJoinPage inviteCode={pageProps?.inviteCode} />
      case "debt-consolidation":
        return <DebtConsolidationPage />
      default:
        return <EnhancedDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Vaquitapp
            </h1>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => setCurrentPage(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* Acciones del Usuario */}
          <div className="flex items-center gap-3">
            {/* Notificaciones */}
            <NotificationsDropdown />

            {/* Menú de Usuario Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Salir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Menú Mobile */}
            <div className="md:hidden">
              <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id)
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentPage("profile")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
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
