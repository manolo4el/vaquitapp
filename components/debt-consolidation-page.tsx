"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, DollarSign, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { calculateGroupBalances } from "@/lib/calculations"

interface DebtConsolidationPageProps {
  onBack: () => void
}

interface Debt {
  from: string
  to: string
  amount: number
  fromName: string
  toName: string
}

export function DebtConsolidationPage({ onBack }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDebts()
    }
  }, [user])

  const loadDebts = async () => {
    if (!user) return

    try {
      // Get all groups where user is a member
      const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid))
      const groupsSnapshot = await getDocs(groupsQuery)

      const allDebts: Debt[] = []

      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data()

        // Get expenses for this group
        const expensesQuery = query(collection(db, "expenses"), where("groupId", "==", groupDoc.id))
        const expensesSnapshot = await getDocs(expensesQuery)

        const expenses = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Calculate balances for this group
        const balances = calculateGroupBalances(expenses, groupData.members)

        // Convert balances to debts
        const positiveBalances = Object.entries(balances).filter(([_, amount]) => amount > 0)
        const negativeBalances = Object.entries(balances).filter(([_, amount]) => amount < 0)

        // Create debt relationships
        for (const [debtor, debtAmount] of negativeBalances) {
          let remainingDebt = Math.abs(debtAmount)

          for (const [creditor, creditAmount] of positiveBalances) {
            if (remainingDebt <= 0) break

            const transferAmount = Math.min(remainingDebt, creditAmount)
            if (transferAmount > 0.01) {
              // Only include debts > 1 cent
              const debtorMember = groupData.members.find((m: any) => m.id === debtor)
              const creditorMember = groupData.members.find((m: any) => m.id === creditor)

              allDebts.push({
                from: debtor,
                to: creditor,
                amount: transferAmount,
                fromName: debtorMember?.name || "Usuario",
                toName: creditorMember?.name || "Usuario",
              })

              remainingDebt -= transferAmount
              // Update the positive balance
              const index = positiveBalances.findIndex(([id]) => id === creditor)
              if (index !== -1) {
                positiveBalances[index][1] -= transferAmount
              }
            }
          }
        }
      }

      // Filter debts involving the current user
      const userDebts = allDebts.filter((debt) => debt.from === user.uid || debt.to === user.uid)

      setDebts(userDebts)
    } catch (error) {
      console.error("Error loading debts:", error)
    } finally {
      setLoading(false)
    }
  }

  const userOwes = debts.filter((debt) => debt.from === user?.uid)
  const userIsOwed = debts.filter((debt) => debt.to === user?.uid)
  const totalOwed = userOwes.reduce((sum, debt) => sum + debt.amount, 0)
  const totalToReceive = userIsOwed.reduce((sum, debt) => sum + debt.amount, 0)
  const netBalance = totalToReceive - totalOwed

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Consolidación de Deudas</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Debes</p>
                  <p className="text-2xl font-bold text-red-600">${totalOwed.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Te deben</p>
                  <p className="text-2xl font-bold text-green-600">${totalToReceive.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance Neto</p>
                  <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${Math.abs(netBalance).toFixed(2)}
                  </p>
                </div>
                <Badge variant={netBalance >= 0 ? "default" : "destructive"}>
                  {netBalance >= 0 ? "A favor" : "En contra"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debts You Owe */}
        {userOwes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Users className="h-5 w-5" />
                Deudas que tienes ({userOwes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userOwes.map((debt, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold">{debt.toName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">Le debes a {debt.toName}</p>
                        <p className="text-sm text-gray-600">Transferir dinero</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-600">${debt.amount.toFixed(2)}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debts Owed to You */}
        {userIsOwed.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Users className="h-5 w-5" />
                Deudas a tu favor ({userIsOwed.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userIsOwed.map((debt, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">{debt.fromName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{debt.fromName} te debe</p>
                        <p className="text-sm text-gray-600">Pendiente de cobro</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-600">${debt.amount.toFixed(2)}</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Debts State */}
        {debts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Todo saldado!</h3>
              <p className="text-gray-600">No tienes deudas pendientes ni dinero por cobrar.</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>¿Cómo funciona la consolidación?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                • <strong>Deudas que tienes:</strong> Dinero que debes transferir a otros usuarios.
              </p>
              <p>
                • <strong>Deudas a tu favor:</strong> Dinero que otros usuarios te deben.
              </p>
              <p>
                • <strong>Balance neto:</strong> La diferencia entre lo que debes y lo que te deben.
              </p>
              <p>• Las deudas se calculan automáticamente basándose en todos los gastos de tus grupos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
