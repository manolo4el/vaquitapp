"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Users, DollarSign, TrendingUp, TrendingDown, Share2 } from "lucide-react"
import { calculateBalances, getUserDisplayName } from "@/lib/calculations"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  members: string[]
  currency: string
}

interface Expense {
  id: string
  amount: number
  paidBy: string
  splitBetween: string[]
  groupId: string
}

interface ConsolidatedDebt {
  groupId: string
  groupName: string
  currency: string
  balance: number
  creditors: { userId: string; amount: number }[]
  debtors: { userId: string; amount: number }[]
}

interface DebtConsolidationPageProps {
  onNavigate: (page: string, param?: string) => void
}

export function DebtConsolidationPage({ onNavigate }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [consolidatedDebts, setConsolidatedDebts] = useState<ConsolidatedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Cargar grupos del usuario
    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid))

    const unsubscribeGroups = onSnapshot(groupsQuery, async (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[]

      setGroups(groupsData)

      // Cargar datos de usuarios de todos los grupos
      const allUserIds = new Set<string>()
      groupsData.forEach((group) => {
        group.members.forEach((memberId) => allUserIds.add(memberId))
      })

      const usersDataMap: any = {}
      await Promise.all(
        Array.from(allUserIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              usersDataMap[userId] = userDoc.data()
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error)
          }
        }),
      )
      setUsersData(usersDataMap)
    })

    // Cargar gastos de todos los grupos
    const expensesQuery = query(collection(db, "expenses"))

    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]

      setExpenses(expensesData)
      setLoading(false)
    })

    return () => {
      unsubscribeGroups()
      unsubscribeExpenses()
    }
  }, [user])

  useEffect(() => {
    if (groups.length > 0 && expenses.length > 0) {
      const consolidated: ConsolidatedDebt[] = groups.map((group) => {
        const groupExpenses = expenses.filter((expense) => expense.groupId === group.id)
        const balances = calculateBalances(groupExpenses, group.members)

        const creditors = Object.entries(balances)
          .filter(([_, balance]) => (balance as number) > 0)
          .map(([userId, amount]) => ({ userId, amount: amount as number }))
          .sort((a, b) => b.amount - a.amount)

        const debtors = Object.entries(balances)
          .filter(([_, balance]) => (balance as number) < 0)
          .map(([userId, amount]) => ({ userId, amount: Math.abs(amount as number) }))
          .sort((a, b) => b.amount - a.amount)

        return {
          groupId: group.id,
          groupName: group.name,
          currency: group.currency,
          balance: balances[user?.uid || ""] || 0,
          creditors,
          debtors,
        }
      })

      setConsolidatedDebts(consolidated)
    }
  }, [groups, expenses, user])

  const handleShareConsolidation = async () => {
    if (!user) return

    try {
      const totalOwed = consolidatedDebts.reduce((sum, debt) => (debt.balance > 0 ? sum + debt.balance : sum), 0)
      const totalDebt = consolidatedDebts.reduce(
        (sum, debt) => (debt.balance < 0 ? sum + Math.abs(debt.balance) : sum),
        0,
      )

      const shareText = `Mi resumen de gastos en Vaquitapp:
${totalOwed > 0 ? `Me deben: $${totalOwed.toFixed(2)}` : ""}
${totalDebt > 0 ? `Debo: $${totalDebt.toFixed(2)}` : ""}
${totalOwed === 0 && totalDebt === 0 ? "Estoy al día con todos mis gastos" : ""}

¡Únete a Vaquitapp para gestionar gastos compartidos!`

      if (navigator.share) {
        await navigator.share({
          title: "Mi resumen de gastos - Vaquitapp",
          text: shareText,
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        toast.success("Resumen copiado al portapapeles")
      }
    } catch (error) {
      console.error("Error sharing consolidation:", error)
      toast.error("Error al compartir el resumen")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consolidación...</p>
        </div>
      </div>
    )
  }

  const totalOwed = consolidatedDebts.reduce((sum, debt) => (debt.balance > 0 ? sum + debt.balance : sum), 0)
  const totalDebt = consolidatedDebts.reduce((sum, debt) => (debt.balance < 0 ? sum + Math.abs(debt.balance) : sum), 0)
  const netBalance = totalOwed - totalDebt

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Consolidación de Deudas</h1>
                <p className="text-sm text-gray-600">Resumen de todos tus grupos</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleShareConsolidation}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Te Deben</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalOwed.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Debes</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalDebt.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${netBalance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <DollarSign className={`h-6 w-6 ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Neto</p>
                  <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    $
                    {Math.abs(netBalance).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">{netBalance >= 0 ? "A tu favor" : "En tu contra"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Breakdown */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Desglose por Grupo</h3>

          {consolidatedDebts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No hay grupos con gastos</h4>
                <p className="text-gray-600">Únete a un grupo y agrega gastos para ver la consolidación</p>
              </CardContent>
            </Card>
          ) : (
            consolidatedDebts.map((debt) => (
              <Card key={debt.groupId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{debt.groupName}</span>
                      <Badge variant="outline">{debt.currency}</Badge>
                    </CardTitle>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${debt.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {debt.currency}{" "}
                        {Math.abs(debt.balance).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-gray-500">{debt.balance >= 0 ? "Te deben" : "Debes"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {debt.creditors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Te deben:</h5>
                      <div className="space-y-2">
                        {debt.creditors.map((creditor) => (
                          <div
                            key={creditor.userId}
                            className="flex items-center justify-between p-2 bg-green-50 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={usersData[creditor.userId]?.photoURL || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {getUserDisplayName(creditor.userId, usersData).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {getUserDisplayName(creditor.userId, usersData)}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {debt.currency}{" "}
                              {creditor.amount.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {debt.debtors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Debes a:</h5>
                      <div className="space-y-2">
                        {debt.debtors.map((debtor) => (
                          <div key={debtor.userId} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={usersData[debtor.userId]?.photoURL || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {getUserDisplayName(debtor.userId, usersData).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {getUserDisplayName(debtor.userId, usersData)}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-red-600">
                              {debt.currency}{" "}
                              {debtor.amount.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("group-details", debt.groupId)}
                      className="w-full"
                    >
                      Ver Detalles del Grupo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
