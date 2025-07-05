"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore"
import { calculateBalancesWithTransfers, formatAmount } from "@/lib/calculations"
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  LogOut,
  User,
  Settings,
  PieChart,
  Target,
} from "lucide-react"
import { GroupCard } from "@/components/group-card"
import { toast } from "@/hooks/use-toast"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useAnalytics } from "@/hooks/use-analytics"
import Image from "next/image"

interface EnhancedDashboardProps {
  onNavigate: (page: string, groupId?: string) => void
}

interface Group {
  id: string
  name: string
  members: string[]
  createdAt: any
  createdBy: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  createdAt: any
  participants?: string[]
}

interface Transfer {
  id: string
  from: string
  to: string
  amount: number
  confirmedAt: any
  confirmedBy: string
}

export function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const { user, logout, userProfile } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [allExpenses, setAllExpenses] = useState<{ [groupId: string]: Expense[] }>({})
  const [allTransfers, setAllTransfers] = useState<{ [groupId: string]: Transfer[] }>({})
  const [usersData, setUsersData] = useState<any>({})
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalOwed, setTotalOwed] = useState(0)
  const [totalOwing, setTotalOwing] = useState(0)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const { trackUserAction, trackGroupAction } = useAnalytics()

  useEffect(() => {
    if (!user) return

    // Escuchar cambios en grupos donde el usuario es miembro
    const groupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", user.uid),
      orderBy("createdAt", "desc"),
    )

    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[]
      setGroups(groupsData)

      // Para cada grupo, escuchar gastos y transferencias
      groupsData.forEach((group) => {
        // Escuchar gastos del grupo
        const expensesUnsub = onSnapshot(collection(db, "groups", group.id, "expenses"), (expensesSnapshot) => {
          const expenses = expensesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[]
          setAllExpenses((prev) => ({ ...prev, [group.id]: expenses }))
        })

        // Escuchar transferencias del grupo
        const transfersUnsub = onSnapshot(collection(db, "groups", group.id, "transfers"), (transfersSnapshot) => {
          const transfers = transfersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transfer[]
          setAllTransfers((prev) => ({ ...prev, [group.id]: transfers }))
        })
      })
    })

    return unsubscribeGroups
  }, [user])

  useEffect(() => {
    // Calcular balances totales
    let totalPositive = 0
    let totalNegative = 0

    groups.forEach((group) => {
      const expenses = allExpenses[group.id] || []
      const transfers = allTransfers[group.id] || []
      const balances = calculateBalancesWithTransfers(group.members, expenses, transfers)
      const userBalance = balances[user?.uid || ""] || 0

      if (userBalance > 0) {
        totalPositive += userBalance
      } else if (userBalance < 0) {
        totalNegative += Math.abs(userBalance)
      }
    })

    setTotalOwed(totalPositive)
    setTotalOwing(totalNegative)
    setTotalBalance(totalPositive - totalNegative)
  }, [groups, allExpenses, allTransfers, user])

  const handleLogout = async () => {
    try {
      await logout()
      trackUserAction("logout", { from_page: "dashboard" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      })
    }
  }

  const handleNavigateToGroup = (groupId: string) => {
    onNavigate("group-details", groupId)
  }

  if (!user) return null

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header con notificaciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">¡Hola, {user.displayName?.split(" ")[0]}! 🐄</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus gastos compartidos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <NotificationsDropdown onNavigateToGroup={handleNavigateToGroup} />

          {/* Perfil */}
          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-primary/20 hover:bg-primary/10"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL || "/placeholder.svg"}
                    alt="Avatar"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle className="text-primary flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mi Perfil
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL || "/placeholder.svg"}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-primary">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      onNavigate("profile")
                      setShowProfileDialog(false)
                    }}
                    variant="outline"
                    className="w-full justify-start border-primary/30 hover:bg-primary/10 text-primary bg-transparent"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Perfil
                  </Button>

                  <Button
                    onClick={() => {
                      onNavigate("debt-consolidation")
                      setShowProfileDialog(false)
                    }}
                    variant="outline"
                    className="w-full justify-start border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Consolidar Deudas
                  </Button>

                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start border-destructive/30 hover:bg-destructive/10 text-destructive bg-transparent"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Balance Total</div>
                <div
                  className={`text-xl font-bold ${
                    totalBalance > 0 ? "text-accent-foreground" : totalBalance < 0 ? "text-destructive" : "text-primary"
                  }`}
                >
                  {totalBalance > 0 ? "+" : ""}${formatAmount(totalBalance)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-full">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Te Deben</div>
                <div className="text-xl font-bold text-accent-foreground">+${formatAmount(totalOwed)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/20 rounded-full">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Debes</div>
                <div className="text-xl font-bold text-destructive">${formatAmount(totalOwing)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => onNavigate("add-expense")}
          className="h-16 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
        >
          <Plus className="h-5 w-5 mr-2" />
          <div className="text-left">
            <div className="font-medium">Agregar Gasto</div>
            <div className="text-xs opacity-90">Registra un nuevo gasto</div>
          </div>
        </Button>

        <Button
          onClick={() => onNavigate("debt-consolidation")}
          variant="outline"
          className="h-16 border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent"
        >
          <PieChart className="h-5 w-5 mr-2" />
          <div className="text-left">
            <div className="font-medium">Ver Resumen</div>
            <div className="text-xs opacity-70">Consolidar deudas</div>
          </div>
        </Button>
      </div>

      {/* Mis Rebaños */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mis Rebaños ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🐄</div>
              <div className="text-lg font-semibold text-primary mb-2">¡Crea tu primer rebaño!</div>
              <div className="text-sm text-muted-foreground mb-4">
                Los rebaños te ayudan a organizar gastos con diferentes grupos de amigos
              </div>
              <Button
                onClick={() => onNavigate("add-expense")}
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Rebaño
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => {
                const expenses = allExpenses[group.id] || []
                const transfers = allTransfers[group.id] || []
                const balances = calculateBalancesWithTransfers(group.members, expenses, transfers)
                const userBalance = balances[user?.uid || ""] || 0
                const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    userBalance={userBalance}
                    totalExpenses={totalExpenses}
                    memberCount={group.members.length}
                    onClick={() => onNavigate("group-details", group.id)}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
