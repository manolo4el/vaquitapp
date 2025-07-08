"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, getDocs } from "firebase/firestore"
import { calculateGroupBalances, getUserDisplayName, formatCurrency } from "@/lib/calculations"
import { Plus, Users, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, Zap, Target } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { GroupCard } from "./group-card"
import { createInvitation } from "@/lib/invitations"

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
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [loading, setLoading] = useState(true)
  const [usersData, setUsersData] = useState<{ [key: string]: any }>({})
  const [groupsData, setGroupsData] = useState<{ [key: string]: any }>({})

  // Cargar grupos del usuario
  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[]

        setGroups(groupsData)

        // Cargar datos adicionales para cada grupo
        const groupsInfo: { [key: string]: any } = {}
        const allUserIds = new Set<string>()

        for (const group of groupsData) {
          // Agregar todos los miembros del grupo al set de usuarios
          group.members.forEach((memberId) => allUserIds.add(memberId))

          // Cargar gastos y transferencias del grupo
          try {
            const expensesSnapshot = await getDocs(collection(db, "groups", group.id, "expenses"))
            const transfersSnapshot = await getDocs(collection(db, "groups", group.id, "transfers"))

            const expenses = expensesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))

            const transfers = transfersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))

            const { balances, totalExpenses } = calculateGroupBalances(group.members, expenses, transfers)

            groupsInfo[group.id] = {
              expenses,
              transfers,
              balances,
              totalExpenses,
            }
          } catch (error) {
            console.error(`Error loading data for group ${group.id}:`, error)
            groupsInfo[group.id] = {
              expenses: [],
              transfers: [],
              balances: {},
              totalExpenses: 0,
            }
          }
        }

        setGroupsData(groupsInfo)

        // Cargar datos de todos los usuarios únicos
        const usersInfo: { [key: string]: any } = {}
        for (const userId of allUserIds) {
          try {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              usersInfo[userId] = userDoc.data()
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error)
          }
        }

        setUsersData(usersInfo)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching groups:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "No se pudieron cargar los grupos",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user])

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return

    try {
      await addDoc(collection(db, "groups"), {
        name: newGroupName.trim(),
        members: [user.uid],
        createdAt: new Date(),
        createdBy: user.uid,
      })

      setNewGroupName("")
      toast({
        title: "¡Grupo creado!",
        description: `El grupo "${newGroupName}" ha sido creado exitosamente`,
      })
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive",
      })
    }
  }

  const shareGroup = async (group: Group) => {
    try {
      const invitationId = await createInvitation(group.id, user!.uid)
      const shareUrl = `${window.location.origin}?invite=${invitationId}`

      if (navigator.share) {
        await navigator.share({
          title: `Únete a "${group.name}" en Vaquitapp`,
          text: `¡Hola! Te invito a unirte a nuestro grupo "${group.name}" para dividir gastos fácilmente.`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "¡Enlace copiado!",
          description: "El enlace de invitación se copió al portapapeles",
        })
      }
    } catch (error) {
      console.error("Error sharing group:", error)
      toast({
        title: "Error",
        description: "No se pudo compartir el grupo",
        variant: "destructive",
      })
    }
  }

  // Calcular estadísticas generales
  const totalBalance = Object.values(groupsData).reduce((total, groupInfo) => {
    const userBalance = groupInfo.balances?.[user?.uid || ""] || 0
    return total + userBalance
  }, 0)

  const totalExpenses = Object.values(groupsData).reduce((total, groupInfo) => {
    return total + (groupInfo.totalExpenses || 0)
  }, 0)

  const activeGroups = groups.length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¡Hola, {getUserDisplayName(user?.uid || "", usersData)}! 👋
          </h1>
          <p className="text-muted-foreground">Administra tus gastos compartidos</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{activeGroups}</div>
              <div className="text-xs text-muted-foreground">Grupos</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary">{formatCurrency(totalExpenses)}</div>
              <div className="text-xs text-muted-foreground">Total gastado</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {totalBalance >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-accent" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className={`text-2xl font-bold ${totalBalance >= 0 ? "text-accent" : "text-destructive"}`}>
                {formatCurrency(Math.abs(totalBalance))}
              </div>
              <div className="text-xs text-muted-foreground">{totalBalance >= 0 ? "Te deben" : "Debes"}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Crear nuevo grupo */}
      <Card className="border-0 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nuevo Grupo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del grupo (ej: Viaje a Bariloche)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  createGroup()
                }
              }}
              className="border-primary/20 focus:border-primary"
            />
            <Button
              onClick={createGroup}
              disabled={!newGroupName.trim()}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Tus Grupos</h2>
          <Badge variant="secondary" className="bg-secondary/20">
            {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
          </Badge>
        </div>

        {groups.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-muted/30 to-secondary/10">
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="text-6xl">🐄</div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">¡Tu primer rebaño te espera!</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Crea tu primer grupo para empezar a dividir gastos con amigos y familia
                  </p>
                </div>
                <Button
                  onClick={() =>
                    document.querySelector<HTMLInputElement>('input[placeholder*="Nombre del grupo"]')?.focus()
                  }
                  className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  ¡Empezar ahora!
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => {
              const groupInfo = groupsData[group.id] || {
                balances: {},
                totalExpenses: 0,
                expenses: [],
              }

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  userBalance={groupInfo.balances[user?.uid || ""] || 0}
                  totalExpenses={groupInfo.totalExpenses}
                  recentExpenses={groupInfo.expenses.slice(-3)}
                  usersData={usersData}
                  onNavigate={onNavigate}
                  onShare={() => shareGroup(group)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      {groups.length > 0 && (
        <>
          <Separator />
          <Card className="border-0 bg-gradient-to-br from-accent/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Target className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => onNavigate("debt-consolidation")}
                variant="outline"
                className="w-full justify-start border-primary/20 hover:bg-primary/10"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Ver consolidación de deudas
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
