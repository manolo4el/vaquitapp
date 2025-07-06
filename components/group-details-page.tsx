"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Users, MessageCircle, DollarSign, UserPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  deleteDoc,
  getDocs,
  where,
} from "firebase/firestore"
import { toast } from "sonner"
import { AddExpensePage } from "./add-expense-page"
import { ExpenseDetailPage } from "./expense-detail-page"
import { GroupChat } from "./group-chat"
import { calculateGroupBalances } from "@/lib/calculations"
import { createNotification } from "@/lib/notifications"
import { useAnalytics } from "@/hooks/use-analytics"

interface GroupDetailsPageProps {
  groupId: string
  onNavigate: (page: string, groupId?: string, expenseId?: string) => void
  onBack: () => void
}

interface Group {
  id: string
  name: string
  description?: string
  members: string[]
  createdBy: string
  createdAt: Date
  lastActivity?: Date
}

interface User {
  id: string
  displayName?: string
  email: string
  photoURL?: string
  paymentInfo?: {
    cbu?: string
    alias?: string
    mercadoPagoLink?: string
  }
}

interface Expense {
  id: string
  title: string
  amount: number
  description?: string
  paidBy: string
  splitBetween: string[]
  split: { [key: string]: number }
  groupId: string
  createdAt: Date
  updatedAt: Date
}

interface Transfer {
  id: string
  from: string
  to: string
  amount: number
  groupId: string
  status: "pending" | "confirmed"
  createdAt: Date
  confirmedAt?: Date
}

type ViewMode = "overview" | "add-expense" | "expense-detail" | "chat"

interface Settlement {
  from: string
  to: string
  amount: number
}

export function GroupDetailsPage({ groupId, onNavigate, onBack }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [balances, setBalances] = useState<{ [key: string]: number }>({})
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [userSettlements, setUserSettlements] = useState<Settlement[]>([])
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [showIncludeInExpensesDialog, setShowIncludeInExpensesDialog] = useState(false)
  const [pendingNewMembers, setPendingNewMembers] = useState<string[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const { trackGroupAction, trackUserAction } = useAnalytics()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    loadGroupData()
    setupRealtimeListeners()
  }, [groupId])

  useEffect(() => {
    if (expenses.length > 0 && transfers.length >= 0) {
      const calculatedBalances = calculateGroupBalances(expenses, transfers)
      setBalances(calculatedBalances)
    }
  }, [expenses, transfers])

  const loadGroupData = async () => {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = groupDoc.data()
        const groupInfo: Group = {
          id: groupDoc.id,
          name: groupData.name,
          description: groupData.description,
          members: groupData.members || [],
          createdBy: groupData.createdBy,
          createdAt: groupData.createdAt?.toDate() || new Date(),
          lastActivity: groupData.lastActivity?.toDate(),
        }
        setGroup(groupInfo)

        // Cargar información de los miembros
        if (groupData.members && groupData.members.length > 0) {
          const memberPromises = groupData.members.map(async (memberId: string) => {
            const userDoc = await getDoc(doc(db, "users", memberId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              return {
                id: userDoc.id,
                displayName: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                paymentInfo: userData.paymentInfo,
              } as User
            }
            return null
          })

          const memberResults = await Promise.all(memberPromises)
          setMembers(memberResults.filter((member): member is User => member !== null))
        }
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
      const expensesData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          amount: data.amount,
          description: data.description,
          paidBy: data.paidBy,
          splitBetween: data.splitBetween || [],
          split: data.split || {},
          groupId: data.groupId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense
      })
      setExpenses(expensesData)
    })

    // Listener para transferencias
    const transfersQuery = query(collection(db, "groups", groupId, "transfers"), orderBy("createdAt", "desc"))

    const unsubscribeTransfers = onSnapshot(transfersQuery, (snapshot) => {
      const transfersData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          from: data.from,
          to: data.to,
          amount: data.amount,
          groupId: data.groupId,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          confirmedAt: data.confirmedAt?.toDate(),
        } as Transfer
      })
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
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getUserName = (userId: string) => {
    const member = members.find((m) => m.id === userId)
    return member?.displayName || member?.email || "Usuario desconocido"
  }

  const getUserPhoto = (userId: string) => {
    const member = members.find((m) => m.id === userId)
    return member?.photoURL
  }

  const addMember = async () => {
    if (!newMemberEmail.trim() || !user || !group) return

    setAddingMember(true)
    try {
      // Buscar usuario por email
      const usersQuery = query(collection(db, "users"), where("email", "==", newMemberEmail.trim().toLowerCase()))
      const userSnapshot = await getDocs(usersQuery)

      if (userSnapshot.empty) {
        toast.error("No se encontró un usuario con ese email")
        return
      }

      const newUser = userSnapshot.docs[0]
      const newUserId = newUser.id
      const newUserData = newUser.data()

      // Verificar si ya es miembro
      if (group.members.includes(newUserId)) {
        toast.error("Este usuario ya es miembro del grupo")
        return
      }

      // Agregar al grupo
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(newUserId),
        lastActivity: new Date(),
      })

      // Crear notificación para el nuevo miembro
      const message = `${user.displayName || user.email || "Alguien"} te agregó al grupo '${group.name}'`
      await createNotification({
        userId: newUserId,
        type: "added_to_group",
        message,
        groupId,
      })

      // Actualizar estado local
      setMembers((prev) => [
        ...prev,
        {
          id: newUserId,
          displayName: newUserData.displayName,
          email: newUserData.email,
          photoURL: newUserData.photoURL,
          paymentInfo: newUserData.paymentInfo,
        },
      ])

      setGroup((prev) => (prev ? { ...prev, members: [...prev.members, newUserId] } : null))

      setNewMemberEmail("")
      toast.success("Miembro agregado exitosamente")
    } catch (error) {
      console.error("Error adding member:", error)
      toast.error("Error al agregar miembro")
    } finally {
      setAddingMember(false)
    }
  }

  const confirmTransfer = async (transferId: string, transfer: Transfer) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "groups", groupId, "transfers", transferId), {
        status: "confirmed",
        confirmedAt: new Date(),
      })

      // Crear notificación para quien hizo el pago
      const message = `${user.displayName || user.email || "Alguien"} confirmó el pago de ${formatAmount(transfer.amount)}`
      await createNotification({
        userId: transfer.from,
        type: "payment_marked",
        message,
        groupId,
      })

      toast.success("Transferencia confirmada")
    } catch (error) {
      console.error("Error confirming transfer:", error)
      toast.error("Error al confirmar transferencia")
    }
  }

  const deleteGroup = async () => {
    if (!user || !group || user.uid !== group.createdBy) return

    if (!confirm("¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      // Eliminar gastos
      const expensesSnapshot = await getDocs(collection(db, "groups", groupId, "expenses"))
      const deleteExpensesPromises = expensesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deleteExpensesPromises)

      // Eliminar transferencias
      const transfersSnapshot = await getDocs(collection(db, "groups", groupId, "transfers"))
      const deleteTransfersPromises = transfersSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deleteTransfersPromises)

      // Eliminar mensajes
      const messagesSnapshot = await getDocs(collection(db, "groups", groupId, "messages"))
      const deleteMessagesPromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deleteMessagesPromises)

      // Eliminar el grupo
      await deleteDoc(doc(db, "groups", groupId))

      toast.success("Grupo eliminado exitosamente")
      onBack()
    } catch (error) {
      console.error("Error deleting group:", error)
      toast.error("Error al eliminar el grupo")
    }
  }

  useEffect(() => {
    if (group && expenses.length >= 0) {
      const calculatedBalances = calculateGroupBalances(expenses, transfers)
      setBalances(calculatedBalances)

      //const calculatedSettlements = efficientTransfers(calculatedBalances)
      //setSettlements(calculatedSettlements)

      // Filtrar liquidaciones donde el usuario actual debe dinero
      //const userDebts = calculatedSettlements.filter((settlement) => settlement.from === user?.uid)
      //setUserSettlements(userDebts)
    }
  }, [group, expenses, transfers, user])

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const userBalance = balances[user?.uid || ""] || 0

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "¡Copiado!",
        description: "Información copiada al portapapeles",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  /*const confirmTransfer = async (settlement: Settlement) => {
    if (!user) return

    try {
      await addDoc(collection(db, "groups", groupId, "transfers"), {
        from: settlement.from,
        to: settlement.to,
        amount: settlement.amount,
        confirmedAt: new Date(),
        confirmedBy: user.uid,
      })

      // Crear notificación para el usuario que recibe el pago
      const fromUserName = usersData[settlement.from]?.displayName || usersData[settlement.from]?.email || "Alguien"
      const message = `${fromUserName} confirmó el pago de $${formatAmount(settlement.amount)}`

      await createNotification({
        userId: settlement.to,
        type: "payment_marked",
        message,
        groupId,
      })

      trackUserAction("transfer_confirmed", {
        amount: settlement.amount,
        group_id: groupId,
        to_user: settlement.to,
      })

      toast({
        title: "¡Transferencia confirmada! 💸",
        description: `Se registró el pago de $${formatAmount(settlement.amount)} a ${getUserDisplayName(settlement.to, usersData)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transferencia",
        variant: "destructive",
      })
    }
  }*/

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Grupo no encontrado</p>
          <Button onClick={onBack} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  if (viewMode === "add-expense") {
    return <AddExpensePage groupId={groupId} onBack={() => setViewMode("overview")} />
  }

  if (viewMode === "expense-detail" && selectedExpenseId) {
    return <ExpenseDetailPage groupId={groupId} expenseId={selectedExpenseId} onBack={() => setViewMode("overview")} />
  }

  if (viewMode === "chat") {
    return <GroupChat groupId={groupId} onBack={() => setViewMode("overview")} />
  }

  // Calcular deudas pendientes
  const pendingTransfers = transfers.filter((t) => t.status === "pending")
  const userOwes = pendingTransfers.filter((t) => t.from === user?.uid).reduce((sum, t) => sum + t.amount, 0)
  const userIsOwed = pendingTransfers.filter((t) => t.to === user?.uid).reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{group.name}</h1>
              <p className="text-sm text-muted-foreground">{members.length} miembros</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("chat")} className="h-8 w-8">
              <MessageCircle className="h-4 w-4" />
            </Button>
            {user?.uid === group.createdBy && (
              <Button variant="ghost" size="icon" onClick={deleteGroup} className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Resumen de balances */}
        {user && balances[user.uid] !== undefined && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Tu balance</p>
                <p
                  className={`text-2xl font-bold ${
                    balances[user.uid] > 0
                      ? "text-green-600"
                      : balances[user.uid] < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {formatAmount(balances[user.uid])}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balances[user.uid] > 0
                    ? "Te deben dinero"
                    : balances[user.uid] < 0
                      ? "Debes dinero"
                      : "Estás al día"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setViewMode("add-expense")} className="h-12">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gasto
          </Button>
          <Button variant="outline" onClick={() => setViewMode("chat")} className="h-12">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat del Grupo
          </Button>
        </div>

        {/* Miembros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Miembros ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.photoURL || "/placeholder.svg"} />
                      <AvatarFallback>{member.displayName?.[0] || member.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {member.displayName || member.email}
                        {member.id === user?.uid && " (Tú)"}
                        {member.id === group.createdBy && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Admin
                          </Badge>
                        )}
                      </p>
                      {balances[member.id] !== undefined && (
                        <p
                          className={`text-xs ${
                            balances[member.id] > 0
                              ? "text-green-600"
                              : balances[member.id] < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {formatAmount(balances[member.id])}
                        </p>
                      )}
                    </div>
                  </div>
                  {!member.paymentInfo && member.id === user?.uid && (
                    <Badge variant="destructive" className="text-xs">
                      ⚠️ Falta info de pago
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Agregar miembro */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Email del nuevo miembro"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addMember()}
                />
                <Button onClick={addMember} disabled={addingMember} size="icon">
                  {addingMember ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transferencias pendientes */}
        {pendingTransfers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getUserPhoto(transfer.from) || "/placeholder.svg"} />
                        <AvatarFallback>{getUserName(transfer.from)[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {getUserName(transfer.from)} → {getUserName(transfer.to)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatAmount(transfer.amount)}</p>
                      </div>
                    </div>
                    {transfer.to === user?.uid && (
                      <Button size="sm" onClick={() => confirmTransfer(transfer.id, transfer)}>
                        Confirmar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay gastos registrados</p>
                <Button onClick={() => setViewMode("add-expense")} className="mt-4">
                  Agregar primer gasto
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                    onClick={() => {
                      setSelectedExpenseId(expense.id)
                      setViewMode("expense-detail")
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getUserPhoto(expense.paidBy) || "/placeholder.svg"} />
                        <AvatarFallback>{getUserName(expense.paidBy)[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{expense.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Pagado por {expense.paidBy === user?.uid ? "ti" : getUserName(expense.paidBy)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatAmount(expense.amount)}</p>
                      <p className="text-xs text-muted-foreground">{expense.createdAt.toLocaleDateString("es-AR")}</p>
                    </div>
                  </div>
                ))}
                {expenses.length > 5 && (
                  <Button variant="outline" className="w-full bg-transparent">
                    Ver todos los gastos ({expenses.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
