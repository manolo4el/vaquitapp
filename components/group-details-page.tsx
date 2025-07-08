"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import {
  calculateGroupBalances,
  efficientTransfers,
  getUserDisplayName,
  formatCurrency,
  parseInputNumber,
} from "@/lib/calculations"
import { ArrowLeft, Plus, Users, DollarSign, Share2, MessageCircle, TrendingUp, TrendingDown, Mail, Calendar, Receipt, ArrowRight, Eye } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { GroupChat } from "./group-chat"
import { createInvitation } from "@/lib/invitations"
import { createNotification } from "@/lib/notifications"
import Image from "next/image"
import { useAnalytics } from "@/hooks/use-analytics"
import { createGroupInvitation } from "@/lib/invitations"

interface GroupDetailsPageProps {
  groupId: string
  onNavigate: (page: string, param?: string, secondParam?: string) => void
}

interface Group {
  id: string
  name: string
  members: string[]
  createdAt: any
  createdBy: string
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
}

export function GroupDetailsPage({ groupId, onNavigate }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [usersData, setUsersData: React.Dispatch<React.SetStateAction<{}>>] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [newExpenseDesc, setNewExpenseDesc] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addMemberMessage, setAddMemberMessage] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [balances, setBalances] = useState<any>({})
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [userSettlements, setUserSettlements] = useState<Settlement[]>([])
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [showIncludeInExpensesDialog, setShowIncludeInExpensesDialog] = useState(false)
  const [pendingNewMembers, setPendingNewMembers] = useState<string[]>([])
  const { trackGroupAction, trackUserAction } = useAnalytics()

  // Cargar datos del grupo
  useEffect(() => {
    if (!groupId || !user) return

    const groupRef = doc(db, "groups", groupId)
    const unsubscribeGroup = onSnapshot(
      groupRef,
      async (doc) => {
        if (doc.exists()) {
          const groupData = { id: doc.id, ...doc.data() } as Group
          setGroup(groupData)

          // Cargar datos de usuarios del grupo
          const usersInfo: { [key: string]: any } = {}
          for (const memberId of groupData.members) {
            try {
              const userDoc = await getDoc(doc(db, "users", memberId))
              if (userDoc.exists()) {
                usersInfo[memberId] = userDoc.data()
              }
            } catch (error) {
              console.error(`Error loading user ${memberId}:`, error)
            }
          }
          setUsersData(usersInfo)
        } else {
          toast({
            title: "Error",
            description: "Grupo no encontrado",
            variant: "destructive",
          })
          onNavigate("dashboard")
        }
      },
      (error) => {
        console.error("Error fetching group:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el grupo",
          variant: "destructive",
        })
      }
    )

    // Cargar gastos
    const expensesRef = collection(db, "groups", groupId, "expenses")
    const expensesQuery = query(expensesRef, orderBy("createdAt", "desc"))
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    })

    // Cargar transferencias
    const transfersRef = collection(db, "groups", groupId, "transfers")
    const unsubscribeTransfers = onSnapshot(transfersRef, (snapshot) => {
      const transfersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transfer[]
      setTransfers(transfersData)
      setLoading(false)
    })

    return () => {
      unsubscribeGroup()
      unsubscribeExpenses()
      unsubscribeTransfers()
    }
  }, [groupId, user, onNavigate])

  const addExpense = async () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount || !user || !group) return

    const amount = parseInputNumber(newExpenseAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Ingresa un monto válido",
        variant: "destructive",
      })
      return
    }

    try {
      const expenseRef = await addDoc(collection(db, "groups", groupId, "expenses"), {
        description: newExpenseDesc.trim(),
        amount,
        paidBy: user.uid,
        participants: group.members,
        createdAt: serverTimestamp(),
      })

      // Crear notificaciones para otros miembros
      const otherMembers = group.members.filter(memberId => memberId !== user.uid)
      for (const memberId of otherMembers) {
        await createNotification({
          userId: memberId,
          type: "expense_added",
          title: "Nuevo gasto agregado",
          message: `${getUserDisplayName(user.uid, usersData)} agregó "${newExpenseDesc}" por ${formatCurrency(amount)}`,
          groupId: groupId,
          expenseId: expenseRef.id,
        })
      }

      setNewExpenseDesc("")
      setNewExpenseAmount("")
      toast({
        title: "¡Gasto agregado!",
        description: `Se agregó "${newExpenseDesc}" por ${formatCurrency(amount)}`,
      })
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto",
        variant: "destructive",
      })
    }
  }

  const addMember = async () => {
    if (!newMemberEmail.trim() || !group) return

    setIsAddingMember(true)
    try {
      const q = query(collection(db, "users"), where("email", "==", newMemberEmail.trim()))
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

      const groupRef = doc(db, "groups", groupId)
      await updateDoc(groupRef, { members: arrayUnion(uidToAdd) })

      // Crear notificación para el nuevo miembro
      await createNotification({
        userId: uidToAdd,
        type: "member_added",
        title: "Te agregaron a un grupo",
        message: `${getUserDisplayName(user!.uid, usersData)} te agregó al grupo "${group.name}"`,
        groupId: groupId,
      })

      setAddMemberMessage("Miembro agregado exitosamente")
      setNewMemberEmail("")
      setTimeout(() => setAddMemberMessage(""), 3000)
    } catch (error) {
      console.error("Error adding member:", error)
      setAddMemberMessage("Error al agregar miembro")
    } finally {
      setIsAddingMember(false)
    }
  }

  const shareGroup = async () => {
    if (!group || !user) return

    try {
      const invitationId = await createInvitation(groupId, user.uid)
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

  if (loading || !group) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  const { balances: calculatedBalances, settlements: calculatedSettlements, totalExpenses } = calculateGroupBalances(group.members, expenses, transfers);
  const userBalance = calculatedBalances[user?.uid || ""] || 0;

  useEffect(() => {
    if (group && expenses.length >= 0) {
      setBalances(calculatedBalances)
      setSettlements(calculatedSettlements)

      // Filtrar liquidaciones donde el usuario actual debe dinero
      const userDebts = calculatedSettlements.filter((settlement) => settlement.from === user?.uid)
      setUserSettlements(userDebts)
    }
  }, [group, expenses, transfers, user, calculatedBalances, calculatedSettlements])

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

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

  const confirmTransfer = async (settlement: Settlement) => {
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
      const message = `${fromUserName} confirmó el pago de $${formatCurrency(settlement.amount)}`

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
        description: `Se registró el pago de $${formatCurrency(settlement.amount)} a ${getUserDisplayName(settlement.to, usersData)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transferencia",
        variant: "destructive",
      })
    }
  }

  const handleAddMembersClick = () => {
    if (selectedNewMembers.length === 0) return

    // Si hay gastos existentes, mostrar el diálogo de confirmación
    if (expenses.length > 0) {
      setPendingNewMembers(selectedNewMembers)
      setShowIncludeInExpensesDialog(true)
    } else {
      // Si no hay gastos, agregar directamente
      addMembersToGroup(false)
    }
  }

  const addMembersToGroup = async (includeInExistingExpenses: boolean) => {
    if (!user || pendingNewMembers.length === 0) return

    try {
      const groupRef = doc(db, "groups", groupId)
      const newMembers = [...group.members, ...pendingNewMembers]

      // Actualizar el grupo con los nuevos miembros
      await updateDoc(groupRef, {
        members: newMembers,
      })

      // Crear notificaciones para los nuevos miembros
      const inviterName = usersData[user.uid]?.displayName || usersData[user.uid]?.email || "Alguien"
      const message = `${inviterName} te agregó al grupo "${group.name}"`

      const notificationPromises = pendingNewMembers.map((memberId) =>
        createNotification({
          userId: memberId,
          type: "added_to_group",
          message,
          groupId,
        }),
      )
      await Promise.all(notificationPromises)

      toast({
        title: "¡Miembros agregados! 👥",
        description: `Se agregaron ${pendingNewMembers.length} nuevo${pendingNewMembers.length !== 1 ? "s" : ""} miembro${pendingNewMembers.length !== 1 ? "s" : ""} al rebaño`,
      })

      setSelectedNewMembers([])
      setPendingNewMembers([])
      setShowIncludeInExpensesDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron agregar los miembros",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{group.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            {group.members.length} miembros • {formatCurrency(totalExpenses)} gastados
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={shareGroup}
          className="border-primary/20 hover:bg-primary/10"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Balance del usuario */}
      <Card className="border-0 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">Tu balance en este grupo</div>
            <div className="space-y-2">
              {userBalance > 0 ? (
                <div className="text-accent-foreground">
                  <div className="text-3xl font-bold text-accent">+{formatCurrency(userBalance)}</div>
                  <div className="text-sm bg-accent/20 px-3 py-1 rounded-full inline-block">
                    ¡Te deben dinero! 🎉
                  </div>
                </div>
              ) : userBalance < 0 ? (
                <div className="text-destructive">
                  <div className="text-3xl font-bold">{formatCurrency(userBalance)}</div>
                  <div className="text-sm bg-destructive/20 px-3 py-1 rounded-full inline-block">
                    Debes dinero 💸
                  </div>
                </div>
              ) : (
                <div className="text-primary">
                  <div className="text-3xl font-bold">{formatCurrency(0)}</div>
                  <div className="text-sm bg-primary/20 px-3 py-1 rounded-full inline-block">
                    ¡Estás al día! ✨
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="expenses" className="text-xs">
            <Receipt className="h-4 w-4 mr-1" />
            Gastos
          </TabsTrigger>
          <TabsTrigger value="balances" className="text-xs">
            <DollarSign className="h-4 w-4 mr-1" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Miembros
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Agregar gasto */}
          <Card className="border-0 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Input
                  placeholder="¿En qué gastaste?"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="¿Cuánto?"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                  <Button
                    onClick={addExpense}
                    disabled={!newExpenseDesc.trim() || !newExpenseAmount}
                    className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de gastos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay gastos registrados</p>
                  <p className="text-sm">¡Agrega el primer gasto del grupo!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate("expense-detail", groupId, expense.id)}
                    >
                      <div className="flex-shrink-0">
                        {usersData[expense.paidBy]?.photoURL ? (
                          <Image
                            src={usersData[expense.paidBy].photoURL || "/placeholder.svg"}
                            alt={getUserDisplayName(expense.paidBy, usersData)}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{expense.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Pagado por {getUserDisplayName(expense.paidBy, usersData)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {expense.createdAt?.toDate?.()?.toLocaleDateString() || "Fecha no disponible"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {formatCurrency(expense.amount)}
                        </Badge>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {/* Balances individuales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balances del Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.members.map((memberId) => {
                  const balance = balances[memberId] || 0
                  const memberData = usersData[memberId]
                  
                  return (
                    <div key={memberId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0">
                        {memberData?.photoURL ? (
                          <Image
                            src={memberData.photoURL || "/placeholder.svg"}
                            alt={getUserDisplayName(memberId, usersData)}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{getUserDisplayName(memberId, usersData)}</div>
                        <div className="text-sm text-muted-foreground">{memberData?.email}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${balance > 0 ? "text-accent" : balance < 0 ? "text-destructive" : "text-primary"}`}>
                          {balance > 0 ? "+" : ""}{formatCurrency(balance)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {balance > 0 ? "Le deben" : balance < 0 ? "Debe" : "Al día"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transferencias sugeridas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transferencias Sugeridas</CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedSettlements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎊</div>
                  <div className="text-lg font-semibold text-accent-foreground">¡Todo saldado!</div>
                  <div className="text-sm text-muted-foreground">El rebaño está en paz</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {calculatedSettlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {usersData[settlement.from]?.photoURL ? (
                          <Image
                            src={usersData[settlement.from].photoURL || "/placeholder.svg"}
                            alt={getUserDisplayName(settlement.from, usersData)}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-primary">{getUserDisplayName(settlement.from, usersData)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-shrink-0">
                        {usersData[settlement.to]?.photoURL ? (
                          <Image
                            src={usersData[settlement.to].photoURL || "/placeholder.svg"}
                            alt={getUserDisplayName(settlement.to, usersData)}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-primary">{getUserDisplayName(settlement.to, usersData)}</span>
                      <Badge className="ml-auto bg-accent/20 text-accent-foreground">
                        {formatCurrency(settlement.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {/* Lista de miembros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Miembros del Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.members.map((memberId) => {
                  const memberData = usersData[memberId]
                  const isCreator = memberId === group.createdBy
                  
                  return (
                    <div key={memberId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0">
                        {memberData?.photoURL ? (
                          <Image
                            src={memberData.photoURL || "/placeholder.svg"}
                            alt={getUserDisplayName(memberId, usersData)}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {getUserDisplayName(memberId, usersData)}
                          {isCreator && (
                            <Badge variant="secondary" className="text-xs">
                              Creador
                            </Badge>
                          )}
                          {memberId === user?.uid && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{memberData?.email}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
                  className="border-primary/20 focus:border-primary"
                />
                <Button 
                  onClick={addMember} 
                  disabled={isAddingMember || !newMemberEmail.trim()}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isAddingMember ? "Agregando..." : "Invitar"}
                </Button>
              </div>
              {addMemberMessage && (
                <div
                  className={`text-sm p-2 rounded ${
                    addMemberMessage.includes("exitosamente") 
                      ? "text-accent-foreground bg-accent/20" 
                      : "text-destructive bg-destructive/20"
                  }`}
                >
                  {addMemberMessage}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <GroupChat groupId={groupId} groupName={group.name} usersData={usersData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
