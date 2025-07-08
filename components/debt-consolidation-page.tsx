"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import {
  calculateBalancesWithTransfers,
  efficientTransfers,
  getUserDisplayName,
  formatAmount,
} from "@/lib/calculations"
import { ArrowLeft, Users, ArrowRight, Share, CreditCard } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface DebtConsolidationPageProps {
  onNavigate: (page: string, groupId?: string) => void
}

interface GroupData {
  id: string
  name: string
  members: string[]
  expenses: any[]
  transfers: any[]
}

interface ConsolidatedDebt {
  to: string
  amount: number
  groups: { groupId: string; groupName: string; amount: number }[]
}

export function DebtConsolidationPage({ onNavigate }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupData[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [consolidatedDebts, setConsolidatedDebts] = useState<ConsolidatedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const unsubscribes: (() => void)[] = []

    const loadUserGroups = async () => {
      try {
        // Obtener grupos donde el usuario es miembro
        const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid))

        const groupsUnsub = onSnapshot(groupsQuery, async (snapshot) => {
          const groupsData: GroupData[] = []
          const allUserIds = new Set<string>()

          for (const groupDoc of snapshot.docs) {
            const groupData = { id: groupDoc.id, ...groupDoc.data() }

            // Agregar todos los miembros del grupo para cargar sus datos
            groupData.members.forEach((memberId: string) => allUserIds.add(memberId))

            // Cargar gastos del grupo
            const expensesUnsub = onSnapshot(collection(db, "groups", groupDoc.id, "expenses"), (expensesSnapshot) => {
              const expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

              // Cargar transferencias del grupo
              const transfersUnsub = onSnapshot(
                collection(db, "groups", groupDoc.id, "transfers"),
                (transfersSnapshot) => {
                  const transfers = transfersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

                  // Actualizar el grupo con gastos y transferencias
                  const updatedGroup = { ...groupData, expenses, transfers }

                  setGroups((prevGroups) => {
                    const existingIndex = prevGroups.findIndex((g) => g.id === groupDoc.id)
                    if (existingIndex >= 0) {
                      const newGroups = [...prevGroups]
                      newGroups[existingIndex] = updatedGroup
                      return newGroups
                    } else {
                      return [...prevGroups, updatedGroup]
                    }
                  })
                },
              )

              unsubscribes.push(transfersUnsub)
            })

            unsubscribes.push(expensesUnsub)
          }

          // Cargar datos de todos los usuarios
          const usersPromises = Array.from(allUserIds).map((uid) => getDoc(doc(db, "users", uid)))
          const usersSnaps = await Promise.all(usersPromises)
          const usersDataMap: any = {}
          usersSnaps.forEach((snap) => {
            if (snap.exists()) {
              usersDataMap[snap.id] = snap.data()
            }
          })
          setUsersData(usersDataMap)
          setLoading(false)
        })

        unsubscribes.push(groupsUnsub)
      } catch (error) {
        console.error("Error loading groups:", error)
        setLoading(false)
      }
    }

    loadUserGroups()

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [user])

  useEffect(() => {
    if (groups.length === 0 || !user) return

    // Calcular deudas consolidadas
    const debtsMap = new Map<string, ConsolidatedDebt>()

    groups.forEach((group) => {
      const balances = calculateBalancesWithTransfers(group.members, group.expenses, group.transfers)
      const settlements = efficientTransfers(balances)

      // Filtrar solo las deudas del usuario actual
      const userDebts = settlements.filter((settlement) => settlement.from === user.uid)

      userDebts.forEach((debt) => {
        const existingDebt = debtsMap.get(debt.to)
        if (existingDebt) {
          existingDebt.amount += debt.amount
          existingDebt.groups.push({
            groupId: group.id,
            groupName: group.name,
            amount: debt.amount,
          })
        } else {
          debtsMap.set(debt.to, {
            to: debt.to,
            amount: debt.amount,
            groups: [
              {
                groupId: group.id,
                groupName: group.name,
                amount: debt.amount,
              },
            ],
          })
        }
      })
    })

    const consolidatedArray = Array.from(debtsMap.values()).sort((a, b) => b.amount - a.amount)
    setConsolidatedDebts(consolidatedArray)
  }, [groups, user])

  const shareDebtReminder = async (debt: ConsolidatedDebt) => {
    const userName = usersData[user?.uid || ""]?.displayName || usersData[user?.uid || ""]?.email || "Alguien"
    const recipientName = getUserDisplayName(debt.to, usersData)

    const groupsList = debt.groups.map((g) => `• ${g.groupName}: $${formatAmount(g.amount)}`).join("\n")

    const message = `¡Hola ${recipientName}! 👋

${userName} te debe un total de $${formatAmount(debt.amount)} en Vaquitapp 🐄

Desglose por grupos:
${groupsList}

¡Sería genial si pudiéramos ponernos al día! 💰

Enviado desde Vaquitapp`

    // Intentar usar la Web Share API nativa
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Recordatorio de deuda - Vaquitapp`,
          text: message,
        })
        return
      } catch (error) {
        // Si el usuario cancela, no hacer nada más
        if (error.name === "AbortError") return
        console.log("Share failed:", error)
      }
    }

    // Fallback: copiar al portapapeles si no hay Web Share API
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: "¡Mensaje copiado! 📋",
        description: "Puedes pegarlo en WhatsApp, Telegram o donde prefieras",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo compartir el recordatorio",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-bounce">
            <Image src="/cow-logo.svg" alt="Loading" width={48} height={48} className="opacity-60 mx-auto" />
          </div>
          <p className="text-muted-foreground">Calculando deudas...</p>
        </div>
      </div>
    )
  }

  const totalDebt = consolidatedDebts.reduce((sum, debt) => sum + debt.amount, 0)

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="border-primary/20 hover:bg-primary/10 h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 truncate">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">Consolidación de Deudas</span>
          </h1>
          <p className="text-sm text-muted-foreground truncate">Resumen de todas tus deudas pendientes</p>
        </div>
      </div>

      {/* Resumen Total */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-destructive flex items-center gap-2">
            💸 Total de Deudas Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5">
            {totalDebt > 0 ? (
              <div className="text-destructive">
                <div className="text-3xl sm:text-4xl font-bold">${formatAmount(totalDebt)}</div>
                <div className="text-xs sm:text-sm bg-destructive/20 px-3 py-1 rounded-full inline-block mt-2">
                  Debes dinero en {groups.length} grupo{groups.length !== 1 ? "s" : ""}
                </div>
              </div>
            ) : (
              <div className="text-primary">
                <div className="text-3xl sm:text-4xl font-bold">$0,00</div>
                <div className="text-xs sm:text-sm bg-primary/20 px-3 py-1 rounded-full inline-block mt-2">
                  ¡Estás al día en todos los grupos! ✨
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Deudas Consolidadas */}
      {consolidatedDebts.length > 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
              📊 Deudas por Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {consolidatedDebts.map((debt, index) => (
              <div key={debt.to} className="space-y-3">
                {/* Header de la deuda */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border border-destructive/20">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {usersData[debt.to]?.photoURL ? (
                      <Image
                        src={usersData[debt.to].photoURL || "/placeholder.svg"}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 sm:h-10 sm:w-10 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-destructive text-sm sm:text-base truncate">
                        {getUserDisplayName(debt.to, usersData)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {debt.groups.length} grupo{debt.groups.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-base sm:text-lg font-bold text-destructive">${formatAmount(debt.amount)}</div>
                    <Button
                      onClick={() => shareDebtReminder(debt)}
                      variant="outline"
                      size="sm"
                      className="mt-1 border-destructive/30 hover:bg-destructive/10 text-destructive bg-transparent h-7 px-2 text-xs"
                    >
                      <Share className="h-3 w-3 mr-1" />
                      Enviar Recordatorio
                    </Button>
                  </div>
                </div>

                {/* Desglose por grupos */}
                <div className="ml-4 sm:ml-6 space-y-2">
                  {debt.groups.map((group) => (
                    <div
                      key={group.groupId}
                      className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onNavigate("group-details", group.groupId)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-primary/20 rounded-full">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-primary truncate">
                            {group.groupName}
                          </div>
                          <div className="text-xs text-muted-foreground">Toca para ver detalles</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-destructive/20 text-destructive text-xs sm:text-sm">
                          ${formatAmount(group.amount)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Separador entre deudas */}
                {index < consolidatedDebts.length - 1 && <div className="border-t border-muted/30 my-4"></div>}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 p-6 bg-accent/10 rounded-full">
              <CreditCard className="h-12 w-12 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-accent-foreground mb-2">¡Excelente! 🎉</h3>
            <p className="text-muted-foreground text-center mb-4">No tienes deudas pendientes en ningún grupo</p>
            <Button onClick={() => onNavigate("dashboard")} className="bg-primary hover:bg-primary/90">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Puedes enviar recordatorios amigables a tus amigos para que sepan cuánto les debes
        </p>
      </div>
    </div>
  )
}
