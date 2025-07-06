"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, Users, MessageCircle, DollarSign, Check, X, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, addDoc, deleteDoc } from "firebase/firestore"
import { toast } from "sonner"
import { FriendsSelector } from "./friends-selector"
import { GroupChat } from "./group-chat"
import { calculateGroupBalances } from "@/lib/calculations"
import { createNotification } from "@/lib/notifications"

interface GroupDetailsPageProps {
  groupId: string
  onBack: () => void
  onAddExpense: () => void
}

interface Group {
  id: string
  name: string
  description?: string
  members: string[]
  createdBy: string
  createdAt: any
}

interface Expense {
  id: string
  title: string
  amount: number
  paidBy: string
  participants: string[]
  splitAmount: number
  createdAt: any
  groupId?: string
}

interface Transfer {
  id: string
  from: string
  to: string
  amount: number
  status: "pending" | "confirmed"
  createdAt: any
  groupId: string
}

interface Friend {
  id: string
  name: string
  email: string
  photoURL?: string
}

export function GroupDetailsPage({ groupId, onBack, onAddExpense }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [usersData, setUsersData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [addingMembers, setAddingMembers] = useState(false)

  useEffect(() => {
    if (groupId) {
      loadGroupData()
      setupRealtimeListeners()
    }
  }, [groupId])

  const loadGroupData = async () => {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group
        setGroup(groupData)

        // Cargar datos de usuarios
        const userPromises = groupData.members.map(async (memberId) => {
          const userDoc = await getDoc(doc(db, "users", memberId))
          return { id: memberId, ...userDoc.data() }
        })
        const users = await Promise.all(userPromises)
        const usersMap = users.reduce(
          (acc, user) => {
            acc[user.id] = user
            return acc
          },
          {} as Record<string, any>,
        )
        setUsersData(usersMap)
      }
    } catch (error) {
      console.error("Error loading group:", error)
      toast.error("Error al cargar el grupo")
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeListeners = () => {
    // Listener para gastos
    const expensesQuery = query(collection(db, "groups", groupId, "expenses"), orderBy("createdAt", "desc"))
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    })

    // Listener para transferencias
    const transfersQuery = query(collection(db, "groups", groupId, "transfers"), orderBy("createdAt", "desc"))
    const unsubscribeTransfers = onSnapshot(transfersQuery, (snapshot) => {
      const transfersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transfer[]
      setTransfers(transfersData)
    })

    return () => {
      unsubscribeExpenses()
      unsubscribeTransfers()
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const balances = group ? calculateGroupBalances(expenses, transfers, group.members) : {}

  const handleAddMembers = async () => {
    if (!user || !group || selectedFriends.length === 0) return

    setAddingMembers(true)
    try {
      const newMemberIds = selectedFriends.map((f) => f.id)
      const updatedMembers = [...group.members, ...newMemberIds]

      await updateDoc(doc(db, "groups", groupId), {
        members: updatedMembers,
      })

      // Crear notificaciones para los nuevos miembros
      const userName = usersData[user.uid]?.displayName || usersData[user.uid]?.email || "Alguien"
      const message = `${userName} te agregó al grupo '${group.name}'`

      for (const friendId of newMemberIds) {
        await createNotification({
          userId: friendId,
          type: "added_to_group",
          message,
          groupId,
        })
      }

      toast.success("Miembros agregados exitosamente")
      setSelectedFriends([])
      setShowAddMembers(false)
      loadGroupData() // Recargar datos del grupo
    } catch (error) {
      console.error("Error adding members:", error)
      toast.error("Error al agregar miembros")
    } finally {
      setAddingMembers(false)
    }
  }

  const handleConfirmTransfer = async (transferId: string, transfer: Transfer) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "groups", groupId, "transfers", transferId), {
        status: "confirmed",
      })

      // Crear notificación para quien hizo el pago
      const userName = usersData[user.uid]?.displayName || usersData[user.uid]?.email || "Alguien"
      const message = `${userName} confirmó el pago de ${formatAmount(transfer.amount)}`

      await createNotification({
        userId: transfer.from,
        type: "payment_marked",
        message,
        groupId,
      })

      toast.success("Transferencia confirmada")
    } catch (error) {
      console.error("Error confirming transfer:", error)
      toast.error("Error al confirmar la transferencia")
    }
  }

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await deleteDoc(doc(db, "groups", groupId, "transfers", transferId))
      toast.success("Transferencia rechazada")
    } catch (error) {
      console.error("Error rejecting transfer:", error)
      toast.error("Error al rechazar la transferencia")
    }
  }

  const createTransfer = async (fromUserId: string, toUserId: string, amount: number) => {
    try {
      await addDoc(collection(db, "groups", groupId, "transfers"), {
        from: fromUserId,
        to: toUserId,
        amount,
        status: "pending",
        createdAt: new Date(),
        groupId,
      })
      toast.success("Solicitud de pago enviada")
    } catch (error) {
      console.error("Error creating transfer:", error)
      toast.error("Error al crear la transferencia")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  if (!group) {
    return <div className="text-center">Grupo no encontrado</div>
  }

  if (showChat) {
    return <GroupChat groupId={groupId} onBack={() => setShowChat(false)} />
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.description && <p className="text-muted-foreground">{group.description}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel izquierdo - Miembros y balances */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Miembros ({group.members.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddMembers(!showAddMembers)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddMembers && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <FriendsSelector
                    selectedFriends={selectedFriends}
                    onSelectionChange={setSelectedFriends}
                    excludeIds={group.members}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddMembers}
                      disabled={selectedFriends.length === 0 || addingMembers}
                    >
                      {addingMembers ? "Agregando..." : "Agregar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddMembers(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {group.members.map((memberId) => {
                const userData = usersData[memberId]
                const balance = balances[memberId] || 0
                return (
                  <div key={memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData?.photoURL || "/placeholder.svg"} />
                        <AvatarFallback>{userData?.displayName?.[0] || userData?.email?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{userData?.displayName || userData?.email}</p>
                        {memberId === group.createdBy && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
                      >
                        {formatAmount(balance)}
                      </p>
                      {balance !== 0 && (
                        <p className="text-xs text-muted-foreground">{balance > 0 ? "le deben" : "debe"}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Transferencias pendientes */}
          {transfers.filter((t) => t.status === "pending").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pagos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transfers
                  .filter((t) => t.status === "pending")
                  .map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={usersData[transfer.from]?.photoURL || "/placeholder.svg"} />
                          <AvatarFallback>
                            {usersData[transfer.from]?.displayName?.[0] || usersData[transfer.from]?.email?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {usersData[transfer.from]?.displayName || usersData[transfer.from]?.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            paga {formatAmount(transfer.amount)} a{" "}
                            {usersData[transfer.to]?.displayName || usersData[transfer.to]?.email}
                          </p>
                        </div>
                      </div>
                      {user?.uid === transfer.to && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleConfirmTransfer(transfer.id, transfer)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectTransfer(transfer.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel derecho - Gastos */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gastos Recientes</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onAddExpense}>
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay gastos registrados</p>
              ) : (
                <div className="space-y-4">
                  {expenses.slice(0, 10).map((expense) => {
                    const paidByUser = usersData[expense.paidBy]
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={paidByUser?.photoURL || "/placeholder.svg"} />
                            <AvatarFallback>
                              {paidByUser?.displayName?.[0] || paidByUser?.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{expense.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Pagado por {paidByUser?.displayName || paidByUser?.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(expense.amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatAmount(expense.splitAmount)} c/u</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción para saldar deudas */}
          {Object.entries(balances).some(([userId, balance]) => userId === user?.uid && balance < 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Saldar Deudas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(balances).map(([userId, balance]) => {
                  if (userId === user?.uid || balance <= 0) return null
                  const userBalance = balances[user?.uid || ""] || 0
                  if (userBalance >= 0) return null

                  const amountToPay = Math.min(Math.abs(userBalance), balance)
                  return (
                    <Button
                      key={userId}
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => createTransfer(user?.uid || "", userId, amountToPay)}
                    >
                      <span>Pagar a {usersData[userId]?.displayName || usersData[userId]?.email}</span>
                      <span>{formatAmount(amountToPay)}</span>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
