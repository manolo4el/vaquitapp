"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore"
import { calculateGroupBalances, getUserDisplayName, formatCurrency } from "@/lib/calculations"
import { ArrowLeft, Users, TrendingUp, TrendingDown, Share2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface DebtConsolidationPageProps {
  onNavigate: (page: string, param?: string) => void
}

interface Group {
  id: string
  name: string
  members: string[]
  createdAt: any
  createdBy: string
}

interface ConsolidatedDebt {
  creditorId: string
  debtorId: string
  amount: number
  groups: string[]
}

export function DebtConsolidationPage({ onNavigate }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [usersData, setUsersData] = useState<{ [key: string]: any }>({})
  const [consolidatedDebts, setConsolidatedDebts] = useState<ConsolidatedDebt[]>([])
  const [loading, setLoading] = useState(true)

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

        // Cargar datos de usuarios y calcular deudas consolidadas
        const allUserIds = new Set<string>()
        const groupBalances: { [groupId: string]: { [userId: string]: number } } = {}

        for (const group of groupsData) {
          group.members.forEach((memberId) => allUserIds.add(memberId))

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

            const { balances } = calculateGroupBalances(group.members, expenses, transfers)
            groupBalances[group.id] = balances
          } catch (error) {
            console.error(`Error loading data for group ${group.id}:`, error)
          }
        }

        // Cargar datos de usuarios
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

        // Consolidar deudas
        const debtsMap: { [key: string]: ConsolidatedDebt } = {}

        Object.entries(groupBalances).forEach(([groupId, balances]) => {
          Object.entries(balances).forEach(([userId, balance]) => {
            if (Math.abs(balance) < 0.01) return // Ignorar balances muy pequeños

            if (balance > 0) {
              // Este usuario es acreedor
              Object.entries(balances).forEach(([otherUserId, otherBalance]) => {
                if (otherUserId !== userId && otherBalance < 0) {
                  // El otro usuario es deudor
                  const key = `${otherUserId}-${userId}`
                  if (!debtsMap[key]) {
                    debtsMap[key] = {
                      creditorId: userId,
                      debtorId: otherUserId,
                      amount: 0,
                      groups: [],
                    }
                  }
                  // Agregar la proporción de deuda de este grupo
                  const debtProportion = Math.min(balance, Math.abs(otherBalance))
                  debtsMap[key].amount += debtProportion
                  if (!debtsMap[key].groups.includes(groupId)) {
                    debtsMap[key].groups.push(groupId)
                  }
                }
              })
            }
          })
        })

        // Filtrar solo deudas significativas y que involucren al usuario actual
        const significantDebts = Object.values(debtsMap)
          .filter((debt) => debt.amount > 0.01 && (debt.creditorId === user.uid || debt.debtorId === user.uid))
          .sort((a, b) => b.amount - a.amount)

        setConsolidatedDebts(significantDebts)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching groups:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user])

  const shareConsolidation = async () => {
    if (!user) return

    try {
      const userDebts = consolidatedDebts.filter((debt) => debt.debtorId === user.uid)
      const userCredits = consolidatedDebts.filter((debt) => debt.creditorId === user.uid)

      let message = `💰 Mi resumen de deudas en Vaquitapp:\n\n`

      if (userDebts.length > 0) {
        message += `📤 Debo:\n`
        userDebts.forEach((debt) => {
          message += `• ${formatCurrency(debt.amount)} a ${getUserDisplayName(debt.creditorId, usersData)}\n`
        })
        message += `\n`
      }

      if (userCredits.length > 0) {
        message += `📥 Me deben:\n`
        userCredits.forEach((debt) => {
          message += `• ${formatCurrency(debt.amount)} de ${getUserDisplayName(debt.debtorId, usersData)}\n`
        })
        message += `\n`
      }

      if (userDebts.length === 0 && userCredits.length === 0) {
        message += `✅ ¡Estoy al día con todos mis gastos compartidos!\n\n`
      }

      message += `Únete a Vaquitapp para dividir gastos fácilmente: ${window.location.origin}`

      if (navigator.share) {
        await navigator.share({
          title: "Mi resumen de deudas - Vaquitapp",
          text: message,
        })
      } else {
        await navigator.clipboard.writeText(message)
        toast({
          title: "¡Copiado!",
          description: "El resumen se copió al portapapeles",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error",
        description: "No se pudo compartir el resumen",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Consolidando deudas...</p>
        </div>
      </div>
    )
  }

  const userDebts = consolidatedDebts.filter((debt) => debt.debtorId === user?.uid)
  const userCredits = consolidatedDebts.filter((debt) => debt.creditorId === user?.uid)
  const totalDebt = userDebts.reduce((sum, debt) => sum + debt.amount, 0)
  const totalCredit = userCredits.reduce((sum, debt) => sum + debt.amount, 0)
  const netBalance = totalCredit - totalDebt

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")} className="hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">Consolidación de Deudas</h1>
          <p className="text-sm text-muted-foreground">Resumen de todas tus deudas y créditos</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={shareConsolidation}
          className="border-primary/20 hover:bg-primary/10 bg-transparent"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Resumen general */}
      <Card className="border-0 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">Tu balance neto consolidado</div>
            <div className="space-y-2">
              {netBalance > 0 ? (
                <div className="text-accent-foreground">
                  <div className="text-4xl font-bold text-accent">+{formatCurrency(netBalance)}</div>
                  <div className="text-sm bg-accent/20 px-4 py-2 rounded-full inline-block">
                    ¡Te deben más de lo que debes! 🎉
                  </div>
                </div>
              ) : netBalance < 0 ? (
                <div className="text-destructive">
                  <div className="text-4xl font-bold">{formatCurrency(netBalance)}</div>
                  <div className="text-sm bg-destructive/20 px-4 py-2 rounded-full inline-block">
                    Debes más de lo que te deben 💸
                  </div>
                </div>
              ) : (
                <div className="text-primary">
                  <div className="text-4xl font-bold">{formatCurrency(0)}</div>
                  <div className="text-sm bg-primary/20 px-4 py-2 rounded-full inline-block">
                    ¡Estás perfectamente balanceado! ⚖️
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <TrendingDown className="h-6 w-6 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</div>
                <div className="text-sm text-muted-foreground">Total que debes</div>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-accent">{formatCurrency(totalCredit)}</div>
                <div className="text-sm text-muted-foreground">Total que te deben</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deudas que tienes */}
      {userDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Dinero que Debes ({userDebts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userDebts.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20"
                >
                  <div className="flex-shrink-0">
                    {usersData[debt.creditorId]?.photoURL ? (
                      <Image
                        src={usersData[debt.creditorId].photoURL || "/placeholder.svg"}
                        alt={getUserDisplayName(debt.creditorId, usersData)}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-destructive">
                      Le debes a {getUserDisplayName(debt.creditorId, usersData)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      En {debt.groups.length} grupo{debt.groups.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Badge variant="destructive" className="font-mono text-base px-3 py-1">
                    {formatCurrency(debt.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dinero que te deben */}
      {userCredits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-accent flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Dinero que te Deben ({userCredits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userCredits.map((debt, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg border border-accent/20">
                  <div className="flex-shrink-0">
                    {usersData[debt.debtorId]?.photoURL ? (
                      <Image
                        src={usersData[debt.debtorId].photoURL || "/placeholder.svg"}
                        alt={getUserDisplayName(debt.debtorId, usersData)}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-accent">
                      {getUserDisplayName(debt.debtorId, usersData)} te debe
                    </div>
                    <div className="text-sm text-muted-foreground">
                      En {debt.groups.length} grupo{debt.groups.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-base px-3 py-1 bg-accent/20 text-accent">
                    {formatCurrency(debt.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado sin deudas */}
      {consolidatedDebts.length === 0 && (
        <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/10">
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">🎊</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-accent">¡Perfecto balance!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  No tienes deudas pendientes ni dinero por cobrar. ¡El rebaño está en perfecta armonía!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="border-0 bg-muted/30">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> Esta consolidación incluye todos tus grupos activos
            </p>
            <p>Los montos se calculan en tiempo real basados en gastos y transferencias confirmadas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
