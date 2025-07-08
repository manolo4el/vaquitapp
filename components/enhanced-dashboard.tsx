"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Users, TrendingUp, PiggyBank } from "lucide-react"
import { calculateGroupBalances, formatCurrency } from "@/lib/calculations"
import { GroupCard } from "./group-card"
import { CreateGroupDialog } from "./create-group-dialog"
import { useAnalytics } from "@/hooks/use-analytics"

interface Group {
  id: string
  name: string
  members: string[]
  createdAt: any
  createdBy: string
}

interface EnhancedDashboardProps {
  onNavigate: (page: string, groupId?: string) => void
}

export function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const { user } = useAuth()
  const { trackUserAction } = useAnalytics()
  const [groups, setGroups] = useState<Group[]>([])
  const [usersData, setUsersData] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [groupsData, setGroupsData] = useState<{ [key: string]: any }>({})

  // Cargar grupos del usuario
  useEffect(() => {
    if (!user) return

    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid))

    const unsubscribe = onSnapshot(
      groupsQuery,
      async (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[]

        setGroups(groupsData)

        // Cargar datos de gastos y transferencias para cada grupo
        const groupsDataMap: { [key: string]: any } = {}

        for (const group of groupsData) {
          try {
            // Cargar gastos
            const expensesQuery = query(collection(db, "groups", group.id, "expenses"))
            const expensesSnapshot = await new Promise((resolve) => {
              const unsubscribeExpenses = onSnapshot(expensesQuery, resolve)
              setTimeout(() => unsubscribeExpenses(), 100) // Cleanup after getting data
            })

            const expenses = (expensesSnapshot as any).docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            }))

            // Cargar transferencias
            const transfersQuery = query(collection(db, "groups", group.id, "transfers"))
            const transfersSnapshot = await new Promise((resolve) => {
              const unsubscribeTransfers = onSnapshot(transfersQuery, resolve)
              setTimeout(() => unsubscribeTransfers(), 100) // Cleanup after getting data
            })

            const transfers = (transfersSnapshot as any).docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            }))

            const { balances, totalExpenses } = calculateGroupBalances(group.members, expenses, transfers)

            groupsDataMap[group.id] = {
              expenses,
              transfers,
              balances,
              totalExpenses,
            }
          } catch (error) {
            console.error(`Error loading data for group ${group.id}:`, error)
            groupsDataMap[group.id] = {
              expenses: [],
              transfers: [],
              balances: {},
              totalExpenses: 0,
            }
          }
        }

        setGroupsData(groupsDataMap)

        // Obtener todos los UIDs únicos de todos los grupos
        const allUserIds = new Set<string>()
        groupsData.forEach((group) => {
          group.members.forEach((memberId) => allUserIds.add(memberId))
        })

        // Cargar datos de todos los usuarios
        const usersDataMap: { [key: string]: any } = {}

        for (const userId of allUserIds) {
          try {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              usersDataMap[userId] = userDoc.data()
            }
          } catch (error) {
            console.error(`Error loading user data for ${userId}:`, error)
          }
        }

        setUsersData(usersDataMap)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching groups:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const handleCreateGroup = () => {
    setShowCreateDialog(true)
    trackUserAction("create_group_attempt", { user_id: user?.uid })
  }

  const handleNavigateToDebtConsolidation = () => {
    onNavigate("debt-consolidation")
    trackUserAction("navigate_to_debt_consolidation", { user_id: user?.uid })
  }

  // Calcular estadísticas generales
  const totalBalance = Object.values(groupsData).reduce((sum, data) => {
    const userBalance = data.balances[user?.uid || ""] || 0
    return sum + userBalance
  }, 0)

  const totalExpenses = Object.values(groupsData).reduce((sum, data) => sum + data.totalExpenses, 0)

  const activeGroups = groups.length
  const totalMembers = new Set(groups.flatMap((group) => group.members)).size

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu rebaño...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            ¡Hola, {user?.displayName?.split(" ")[0] || "Vaquero"}! 🤠
          </h1>
          <p className="text-muted-foreground">Administra tus gastos compartidos como un pro</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency(Math.abs(totalBalance))}</div>
              <div className="text-xs text-muted-foreground">
                {totalBalance > 0 ? "Te deben" : totalBalance < 0 ? "Debes" : "Al día"}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{activeGroups}</div>
              <div className="text-xs text-muted-foreground">Grupos activos</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleCreateGroup}
          className="h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Grupo
        </Button>
        <Button
          onClick={handleNavigateToDebtConsolidation}
          variant="outline"
          className="h-12 border-secondary/30 hover:bg-secondary/10 text-secondary hover:text-secondary bg-transparent"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Consolidar
        </Button>
      </div>

      <Separator />

      {/* Lista de grupos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tus Rebaños
          </h2>
          <Badge variant="secondary" className="bg-secondary/20">
            {groups.length} grupos
          </Badge>
        </div>

        {groups.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-6xl">🐄</div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">¡Tu primer rebaño te espera!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Crea un grupo para empezar a dividir gastos con tus amigos de manera inteligente
                </p>
              </div>
              <Button
                onClick={handleCreateGroup}
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear mi primer grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const groupData = groupsData[group.id] || { balances: {}, totalExpenses: 0 }
              const userBalance = groupData.balances[user?.uid || ""] || 0

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  userBalance={userBalance}
                  totalExpenses={groupData.totalExpenses}
                  usersData={usersData}
                  onClick={() => onNavigate("group-details", group.id)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Información adicional */}
      {groups.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-accent/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Resumen General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{formatCurrency(totalExpenses)}</div>
                <div className="text-xs text-muted-foreground">Total gastado</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">{totalMembers}</div>
                <div className="text-xs text-muted-foreground">Amigos únicos</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">{activeGroups}</div>
                <div className="text-xs text-muted-foreground">Grupos activos</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estado general:</span>
              <div className="flex items-center gap-2">
                {totalBalance > 0 ? (
                  <>
                    <span className="text-accent-foreground font-medium">Te deben {formatCurrency(totalBalance)}</span>
                    <div className="h-2 w-2 bg-accent rounded-full"></div>
                  </>
                ) : totalBalance < 0 ? (
                  <>
                    <span className="text-destructive font-medium">Debes {formatCurrency(Math.abs(totalBalance))}</span>
                    <div className="h-2 w-2 bg-destructive rounded-full"></div>
                  </>
                ) : (
                  <>
                    <span className="text-primary font-medium">¡Todo saldado!</span>
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateGroupDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
