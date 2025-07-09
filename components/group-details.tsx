"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, updateDoc, arrayUnion, query, where, getDocs } from "firebase/firestore"
import { efficientTransfers, getUserDisplayName } from "@/lib/calculations"
import { Plus, Users, Mail, ArrowRight } from "lucide-react"

interface GroupDetailsProps {
  group: any
  isOpen: boolean
  onClose: () => void
  expenses: any[]
  usersData: any
  balances: any
}

export function GroupDetails({ group, isOpen, onClose, expenses, usersData, balances }: GroupDetailsProps) {
  const { user } = useAuth()
  const [newExpenseDesc, setNewExpenseDesc] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addMemberMessage, setAddMemberMessage] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const addExpense = async () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount || !user) return

    const amount = Number.parseFloat(newExpenseAmount)
    if (isNaN(amount) || amount <= 0) return

    await addDoc(collection(db, "groups", group.id, "expenses"), {
      description: newExpenseDesc,
      amount,
      paidBy: user.uid,
      createdAt: new Date(),
    })

    setNewExpenseDesc("")
    setNewExpenseAmount("")
  }

  const addMember = async () => {
    if (!newMemberEmail.trim()) return

    setIsAddingMember(true)
    try {
      const q = query(collection(db, "users"), where("email", "==", newMemberEmail))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setAddMemberMessage("No existe usuario con ese email")
        return
      }

      const userToAdd = snapshot.docs[0]
      const uidToAdd = userToAdd.id

      if (group.members.includes(uidToAdd)) {
        setAddMemberMessage("Ya es miembro del grupo")
        return
      }

      const groupRef = doc(db, "groups", group.id)
      await updateDoc(groupRef, { members: arrayUnion(uidToAdd) })

      setAddMemberMessage("Miembro agregado exitosamente")
      setNewMemberEmail("")
      setTimeout(() => setAddMemberMessage(""), 3000)
    } catch (error) {
      setAddMemberMessage("Error al agregar miembro")
    } finally {
      setIsAddingMember(false)
    }
  }

  const settlements = efficientTransfers(balances)
  const userBalance = balances[user?.uid || ""] || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {group.name}
            </span>
            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
              {group.members.length} vacas 🐄
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resumen de balances */}
          <Card className="border-0 bg-gradient-to-br from-card to-secondary/5">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2">💰 Tu Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-muted/30 to-secondary/10">
                {userBalance > 0 ? (
                  <div className="text-accent-foreground">
                    <div className="text-3xl font-bold">+${userBalance.toFixed(2)}</div>
                    <div className="text-sm bg-accent/20 px-3 py-1 rounded-full inline-block mt-2">
                      ¡Te deben dinero! 🎉
                    </div>
                  </div>
                ) : userBalance < 0 ? (
                  <div className="text-destructive">
                    <div className="text-3xl font-bold">${userBalance.toFixed(2)}</div>
                    <div className="text-sm bg-destructive/20 px-3 py-1 rounded-full inline-block mt-2">
                      Debes dinero 💸
                    </div>
                  </div>
                ) : (
                  <div className="text-primary">
                    <div className="text-3xl font-bold">$0.00</div>
                    <div className="text-sm bg-primary/20 px-3 py-1 rounded-full inline-block mt-2">
                      ¡Estás al día! ✨
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transferencias sugeridas */}
          <Card className="border-0 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                🔄 Transferencias Sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎊</div>
                  <div className="text-lg font-semibold text-accent-foreground">¡Todo saldado!</div>
                  <div className="text-sm text-muted-foreground">El rebaño está en paz</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl"
                    >
                      <span className="font-medium text-primary">{getUserDisplayName(settlement.from, usersData)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-primary">{getUserDisplayName(settlement.to, usersData)}</span>
                      <Badge className="ml-auto bg-accent/20 text-accent-foreground">
                        ${settlement.amount.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Agregar gasto */}
        <Card className="border-0 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">💸 Agregar Gasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="¿En qué gastaste?"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
              <Input
                type="number"
                placeholder="¿Cuánto?"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
              <Button
                onClick={addExpense}
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />✨ Agregar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No hay gastos registrados</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {expenses
                  .slice()
                  .reverse()
                  .map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-gray-600">
                          Pagado por {getUserDisplayName(expense.paidBy, usersData)}
                        </div>
                      </div>
                      <Badge variant="outline">${expense.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agregar miembro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invitar Amigo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email del amigo"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={isAddingMember}
              />
              <Button onClick={addMember} disabled={isAddingMember}>
                <Mail className="h-4 w-4 mr-2" />
                {isAddingMember ? "Agregando..." : "Invitar"}
              </Button>
            </div>
            {addMemberMessage && (
              <div
                className={`text-sm ${addMemberMessage.includes("exitosamente") ? "text-green-600" : "text-red-600"}`}
              >
                {addMemberMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
