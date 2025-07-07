"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore"
import {
  calculateBalancesWithTransfers,
  efficientTransfers,
  getUserDisplayName,
  formatAmount,
} from "@/lib/calculations"
import { ArrowLeft, ArrowRight, Share, Users, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { useAnalytics } from "@/hooks/use-analytics"

interface DebtConsolidationPageProps {
  onNavigate: (page: string, groupId?: string) => void
}

interface Group {
  id: string
  name: string
  members: string[]
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

interface Settlement {
  from: string
  to: string
  amount: number
  groupId: string
  groupName: string
}

export function DebtConsolidationPage({ onNavigate }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [allExpenses, setAllExpenses] = useState<{ [groupId: string]: Expense[] }>({})
  const [allTransfers, setAllTransfers] = useState<{ [groupId: string]: Transfer[] }>({})
  const [usersData, setUsersData] = useState<any>({})
  const [consolidatedSettlements, setConsolidatedSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const { trackUserAction } = useAnalytics()

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Cargar grupos donde el usuario es miembro
        const unsubscribeGroups = onSnapshot(collection(db, "groups"), async (snapshot) => {
          const groupsData = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Group)
            .filter((group) => group.members.includes(user.uid))

          setGroups(groupsData)

          // Cargar datos de usuarios de todos los grupos
          const allUserIds = new Set<string>()
          groupsData.forEach((group) => {
            group.members.forEach((memberId) => allUserIds.add(memberId))
          })

          const usersPromises = Array.from(allUserIds).map((uid) => getDoc(doc(db, "users", uid)))
          const usersSnaps = await Promise.all(usersPromises)
          const usersDataMap: any = {}
          usersSnaps.forEach((snap) => {
            if (snap.exists()) {
              usersDataMap[snap.id] = snap.data()
            }
          })
          setUsersData(usersDataMap)

          // Configurar listeners para gastos y transferencias de cada grupo
          const expensesUnsubscribers: (() => void)[] = []
          const transfersUnsubscribers: (() => void)[] = []

          groupsData.forEach((group) => {
            // Listener para gastos
            const expensesUnsub = onSnapshot(collection(db, "groups", group.id, "expenses"), (expensesSnapshot) => {
              const expensesData = expensesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Expense[]

              setAllExpenses((prev) => ({
                ...prev,
                [group.id]: expensesData,
              }))
            })
            expensesUnsubscribers.push(expensesUnsub)

            // Listener para transferencias
            const transfersUnsub = onSnapshot(collection(db, "groups", group.id, "transfers"), (transfersSnapshot) => {
              const transfersData = transfersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Transfer[]

              setAllTransfers((prev) => ({
                ...prev,
                [group.id]: transfersData,
              }))
            })
            transfersUnsubscribers.push(transfersUnsub)
          })

          // Cleanup function
          return () => {
            expensesUnsubscribers.forEach((unsub) => unsub())
            transfersUnsubscribers.forEach((unsub) => unsub())
          }
        })

        setLoading(false)
        return unsubscribeGroups
      } catch (error) {
        console.error("Error loading debt consolidation data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    // Calcular liquidaciones consolidadas cuando cambien los datos
    if (groups.length === 0) return

    const allSettlements: Settlement[] = []

    groups.forEach((group) => {
      const expenses = allExpenses[group.id] || []
      const transfers = allTransfers[group.id] || []

      if (expenses.length > 0) {
        const balances = calculateBalancesWithTransfers(group.members, expenses, transfers)
        const settlements = efficientTransfers(balances)

        settlements.forEach((settlement) => {
          allSettlements.push({
            ...settlement,
            groupId: group.id,
            groupName: group.name,
          })
        })
      }
    })

    // Consolidar deudas entre las mismas personas
    const consolidatedMap = new Map<string, Settlement>()

    allSettlements.forEach((settlement) => {
      const key1 = `${settlement.from}-${settlement.to}`
      const key2 = `${settlement.to}-${settlement.from}`

      if (consolidatedMap.has(key1)) {
        // Sumar a la deuda existente
        const existing = consolidatedMap.get(key1)!
        existing.amount += settlement.amount
        existing.groupName += `, ${settlement.groupName}`
      } else if (consolidatedMap.has(key2)) {
        // Restar de la deuda opuesta
        const existing = consolidatedMap.get(key2)!
        if (existing.amount > settlement.amount) {
          existing.amount -= settlement.amount
          existing.groupName += `, ${settlement.groupName}`
        } else if (existing.amount < settlement.amount) {
          // Cambiar dirección de la deuda
          consolidatedMap.delete(key2)
          consolidatedMap.set(key1, {
            from: settlement.from,
            to: settlement.to,
            amount: settlement.amount - existing.amount,
            groupId: "consolidated",
            groupName: `${existing.groupName}, ${settlement.groupName}`,
          })
        } else {
          // Se cancelan
          consolidatedMap.delete(key2)
        }
      } else {
        consolidatedMap.set(key1, { ...settlement })
      }
    })

    const finalSettlements = Array.from(consolidatedMap.values()).filter((s) => s.amount > 0)
    setConsolidatedSettlements(finalSettlements)
  }, [groups, allExpenses, allTransfers])

  const shareDebtSummary = async () => {
    const userDebts = consolidatedSettlements.filter((s) => s.from === user?.uid)
    const userCredits = consolidatedSettlements.filter((s) => s.to === user?.uid)

    let message = "💰 Mi resumen de deudas en Vaquitapp:\n\n"

    if (userDebts.length > 0) {
      message += "💸 Debo:\n"
      userDebts.forEach((debt) => {
        message += `• $${formatAmount(debt.amount)} a ${getUserDisplayName(debt.to, usersData)}\n`
      })
      message += "\n"
    }

    if (userCredits.length > 0) {
      message += "💰 Me deben:\n"
      userCredits.forEach((credit) => {
        message += `• $${formatAmount(credit.amount)} de ${getUserDisplayName(credit.from, usersData)}\n`
      })
      message += "\n"
    }

    if (userDebts.length === 0 && userCredits.length === 0) {
      message += "✨ ¡Estoy al día con todas mis deudas!\n\n"
    }

    message += "📱 Descarga Vaquitapp para dividir gastos fácilmente"

    // Intentar usar la Web Share API nativa
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mi resumen de deudas - Vaquitapp",
          text: message,
        })

        trackUserAction("debt_summary_shared", {
          share_method: "native",
          debts_count: userDebts.length,
          credits_count: userCredits.length,
        })
        return
      } catch (error: any) {
        // Si el usuario cancela, no hacer nada más
        if (error.name === "AbortError") return
        console.log("Share failed:", error)
      }
    }

    // Fallback: copiar al portapapeles si no hay Web Share API
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: "¡Resumen copiado! 📋",
        description: "Comparte tu resumen de deudas",
      })

      trackUserAction("debt_summary_shared", {
        share_method: "clipboard",
        debts_count: userDebts.length,
        credits_count: userCredits.length,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo compartir el resumen",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const userDebts = consolidatedSettlements.filter((s) => s.from === user?.uid)
  const userCredits = consolidatedSettlements.filter((s) => s.to === user?.uid)
  const totalDebt = userDebts.reduce((sum, debt) => sum + debt.amount, 0)
  const totalCredit = userCredits.reduce((sum, credit) => sum + credit.amount, 0)
  const netBalance = totalCredit - totalDebt

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="border-primary/20 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Consolidación de Deudas
          </h1>
          <p className="text-sm text-muted-foreground">Resumen global de todas tus deudas</p>
        </div>
        <Button
          onClick={shareDebtSummary}
          variant="outline"
          size="sm"
          className="border-primary/20 hover:bg-primary/10 text-primary bg-transparent"
        >
          <Share className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </div>

      {/* Resumen General */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary">💰 Tu Balance Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Debes</span>
              </div>
              <div className="text-2xl font-bold text-destructive">${formatAmount(totalDebt)}</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
                <span className="font-medium text-accent-foreground">Te deben</span>
              </div>
              <div className="text-2xl font-bold text-accent-foreground">+${formatAmount(totalCredit)}</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Minus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">Balance Neto</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  netBalance > 0 ? "text-accent-foreground" : netBalance < 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {netBalance > 0 ? "+" : ""}${formatAmount(netBalance)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deudas que debes */}
      {userDebts.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardHeader>
            <CardTitle className="text-xl text-destructive flex items-center gap-2">
              💸 Deudas que debes pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userDebts.map((debt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border border-destructive/20"
              >
                <div className="flex items-center gap-3 flex-1">
                  {usersData[debt.to]?.photoURL ? (
                    <Image
                      src={usersData[debt.to].photoURL || "/placeholder.svg"}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-destructive/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-destructive">Debes a {getUserDisplayName(debt.to, usersData)}</div>
                    <div className="text-sm text-muted-foreground">
                      {debt.groupId === "consolidated" ? "Múltiples grupos" : debt.groupName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-destructive">${formatAmount(debt.amount)}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Deudas que te deben */}
      {userCredits.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <CardTitle className="text-xl text-accent-foreground flex items-center gap-2">
              💰 Deudas que te deben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userCredits.map((credit, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20"
              >
                <div className="flex items-center gap-3 flex-1">
                  {usersData[credit.from]?.photoURL ? (
                    <Image
                      src={usersData[credit.from].photoURL || "/placeholder.svg"}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-accent-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-accent-foreground">
                      {getUserDisplayName(credit.from, usersData)} te debe
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {credit.groupId === "consolidated" ? "Múltiples grupos" : credit.groupName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-accent-foreground">+${formatAmount(credit.amount)}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Estado sin deudas */}
      {userDebts.length === 0 && userCredits.length === 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-primary mb-2">¡Estás al día!</h3>
            <p className="text-muted-foreground">No tienes deudas pendientes en ningún grupo</p>
          </CardContent>
        </Card>
      )}

      {/* Todas las liquidaciones consolidadas */}
      {consolidatedSettlements.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              🔄 Todas las Liquidaciones Consolidadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consolidatedSettlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl"
                >
                  <span className="font-medium text-primary flex-1">
                    {getUserDisplayName(settlement.from, usersData)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-primary flex-1">
                    {getUserDisplayName(settlement.to, usersData)}
                  </span>
                  <Badge className="bg-accent/20 text-accent-foreground">${formatAmount(settlement.amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-accent-foreground">💡 Tip</div>
            <div className="text-xs text-muted-foreground">
              Esta consolidación optimiza tus transferencias combinando deudas de múltiples grupos para minimizar el
              número de pagos necesarios.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
