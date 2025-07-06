"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Receipt, Share2, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatCurrency, calculateGroupBalances } from "@/lib/calculations"
import { GroupChat } from "./group-chat"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface GroupDetailsPageProps {
  groupId?: string
  onNavigate: (page: string, data?: any) => void
}

interface GroupMember {
  id: string
  name: string
  email: string
  photoURL?: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  paidByName: string
  participants: string[]
  createdAt: Date
  category: string
  groupId: string
}

interface Group {
  id: string
  name: string
  description?: string
  members: string[]
  memberDetails: GroupMember[]
  createdBy: string
  createdAt: Date
  inviteCode: string
}

interface Balance {
  userId: string
  userName: string
  balance: number
  owes: { [key: string]: number }
  owedBy: { [key: string]: number }
}

export function GroupDetailsPage({ groupId, onNavigate }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("expenses")

  useEffect(() => {
    if (groupId && user) {
      loadGroup()
      setupExpensesListener()
    }
  }, [groupId, user])

  useEffect(() => {
    if (group && expenses.length > 0) {
      const calculatedBalances = calculateGroupBalances(expenses, group.memberDetails)
      setBalances(calculatedBalances)
    }
  }, [group, expenses])

  const loadGroup = async () => {
    if (!groupId) return

    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = groupDoc.data()

        // Load member details
        const memberDetails: GroupMember[] = []
        for (const memberId of groupData.members) {
          const memberDoc = await getDoc(doc(db, "users", memberId))
          if (memberDoc.exists()) {
            const memberData = memberDoc.data()
            memberDetails.push({
              id: memberId,
              name: memberData.name || memberData.email,
              email: memberData.email,
              photoURL: memberData.photoURL,
            })
          }
        }

        setGroup({
          id: groupDoc.id,
          name: groupData.name,
          description: groupData.description,
          members: groupData.members,
          memberDetails,
          createdBy: groupData.createdBy,
          createdAt: groupData.createdAt?.toDate() || new Date(),
          inviteCode: groupData.inviteCode,
        })
      }
    } catch (error) {
      console.error("Error loading group:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el grupo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setupExpensesListener = () => {
    if (!groupId) return

    const expensesRef = collection(db, "expenses")
    const q = query(expensesRef, where("groupId", "==", groupId), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesList: Expense[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        expensesList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Expense)
      })
      setExpenses(expensesList)
    })

    return unsubscribe
  }

  const handleAddMember = async (newMemberEmail: string) => {
    if (!group || !user) return

    try {
      // This would typically involve sending an invitation
      // For now, we'll just show a success message
      toast({
        title: "Invitación enviada",
        description: `Se envió una invitación a ${newMemberEmail}`,
      })
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación",
        variant: "destructive",
      })
    }
  }

  const handlePayDebt = async (creditorId: string, amount: number) => {
    if (!group || !user) return

    try {
      // Create a payment record (this would be more complex in a real app)
      const paymentData = {
        fromUserId: user.uid,
        toUserId: creditorId,
        amount,
        groupId: group.id,
        groupName: group.name,
        createdAt: Timestamp.now(),
        type: "payment",
      }

      // In a real app, you'd add this to a payments collection
      // For now, we'll just create a notification
      const creditor = group.memberDetails.find((m) => m.id === creditorId)
      if (creditor) {
        await createNotification(
          creditorId,
          "debt_paid",
          "Deuda pagada",
          `${user.displayName || user.email} te pagó ${formatCurrency(amount)}`,
          group.id,
          group.name,
          user.uid,
          user.displayName || user.email,
        )
      }

      toast({
        title: "¡Pago registrado!",
        description: `Se registró el pago de ${formatCurrency(amount)}`,
      })
    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      })
    }
  }

  const shareInviteCode = async () => {
    if (!group) return

    const inviteUrl = `${window.location.origin}?invite=${group.inviteCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${group.name}`,
          text: `Te invito a unirte a nuestro grupo de gastos "${group.name}"`,
          url: inviteUrl,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(inviteUrl)
        toast({
          title: "Enlace copiado",
          description: "El enlace de invitación se copió al portapapeles",
        })
      }
    } else {
      navigator.clipboard.writeText(inviteUrl)
      toast({
        title: "Enlace copiado",
        description: "El enlace de invitación se copió al portapapeles",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Grupo no encontrado</p>
          <Button onClick={() => onNavigate("groups")}>Volver a grupos</Button>
        </div>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const userBalance = balances.find((b) => b.userId === user?.uid)

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("groups")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">{group.name}</h1>
            <p className="text-sm text-muted-foreground">{group.members.length} miembros</p>
          </div>
          <Button variant="ghost" size="icon" onClick={shareInviteCode}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total gastado</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalExpenses)}</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tu balance</p>
              <p
                className={`text-lg font-bold ${(userBalance?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(userBalance?.balance || 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Add Expense Button */}
        <Button onClick={() => onNavigate("add-expense", { groupId: group.id })} className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Agregar Gasto
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {expenses.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No hay gastos aún</p>
              <Button onClick={() => onNavigate("add-expense", { groupId: group.id })}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer gasto
              </Button>
            </Card>
          ) : (
            <div className="space-y-3 pb-4">
              {expenses.map((expense) => (
                <Card
                  key={expense.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate("expense-detail", { expenseId: expense.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={
                              group.memberDetails.find((m) => m.id === expense.paidBy)?.photoURL || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {group.memberDetails
                              .find((m) => m.id === expense.paidBy)
                              ?.name.charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(expense.createdAt, "dd MMM", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-sm">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.participants.length} {expense.participants.length === 1 ? "persona" : "personas"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {balances.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay balances que mostrar</p>
            </Card>
          ) : (
            <div className="space-y-3 pb-4">
              {balances.map((balance) => (
                <Card key={balance.userId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              group.memberDetails.find((m) => m.id === balance.userId)?.photoURL || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>{balance.userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{balance.userName}</p>
                          <p className="text-sm text-muted-foreground">{balance.userId === user?.uid ? "Tú" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(balance.balance)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {balance.balance >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {balance.balance >= 0 ? "Le deben" : "Debe"}
                        </div>
                      </div>
                    </div>

                    {/* Debt details */}
                    {Object.keys(balance.owes).length > 0 && (
                      <div className="space-y-2 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Debe a:</p>
                        {Object.entries(balance.owes).map(([creditorId, amount]) => {
                          const creditor = group.memberDetails.find((m) => m.id === creditorId)
                          return (
                            <div key={creditorId} className="flex items-center justify-between text-sm">
                              <span>{creditor?.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-medium">{formatCurrency(amount)}</span>
                                {balance.userId === user?.uid && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePayDebt(creditorId, amount)
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <GroupChat groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
