"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  where,
  getDocs,
} from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Users,
  TrendingUp,
  Share2,
  UserPlus,
  MessageCircle,
  Receipt,
  ArrowRight,
  User,
} from "lucide-react"
import { calculateGroupBalances, formatCurrency, getUserDisplayName } from "@/lib/calculations"
import { GroupChat } from "./group-chat"
import { toast } from "@/hooks/use-toast"
import { useAnalytics } from "@/hooks/use-analytics"
import { createInvitation } from "@/lib/invitations"
import { createNotification } from "@/lib/notifications"
import Image from "next/image"

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

interface GroupDetailsPageProps {
  groupId: string
  onNavigate: (page: string, param?: string, secondParam?: string) => void
}

export function GroupDetailsPage({ groupId, onNavigate }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const { trackUserAction } = useAnalytics()
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [usersData, setUsersData] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addingMember, setAddingMember] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Cargar datos del grupo
  useEffect(() => {
    if (!groupId || !user) return

    const loadGroupData = async () => {
      try {
        // Cargar grupo
        const groupDoc = await getDoc(doc(db, "groups", groupId))
        if (!groupDoc.exists()) {
          toast({
            title: "Error",
            description: "Grupo no encontrado",
            variant: "destructive",
          })
          onNavigate("dashboard")
          return
        }

        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group

        // Verificar que el usuario es miembro
        if (!groupData.members.includes(user.uid)) {
          toast({
            title: "Sin acceso",
            description: "No eres miembro de este grupo",
            variant: "destructive",
          })
          onNavigate("dashboard")
          return
        }

        setGroup(groupData)

        // Cargar datos de usuarios
        const usersDataMap: { [key: string]: any } = {}
        for (const memberId of groupData.members) {
          try {
            const userDoc = await getDoc(doc(db, "users", memberId))
            if (userDoc.exists()) {
              usersDataMap[memberId] = userDoc.data()
            }
          } catch (error) {
            console.error(`Error loading user ${memberId}:`, error)
          }
        }
        setUsersData(usersDataMap)

        // Suscribirse a gastos
        const expensesQuery = query(collection(db, "groups", groupId, "expenses"), orderBy("createdAt", "desc"))
        const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
          const expensesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[]
          setExpenses(expensesData)
        })

        // Suscribirse a transferencias
        const transfersQuery = query(collection(db, "groups", groupId, "transfers"), orderBy("confirmedAt", "desc"))
        const unsubscribeTransfers = onSnapshot(transfersQuery, (snapshot) => {
          const transfersData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transfer[]
          setTransfers(transfersData)
        })

        setLoading(false)

        return () => {
          unsubscribeExpenses()
          unsubscribeTransfers()
        }
      } catch (error) {
        console.error("Error loading group:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el grupo",
          variant: "destructive",
        })
        onNavigate("dashboard")
      }
    }

    loadGroupData()
  }, [groupId, user, onNavigate])

  const addMember = async () => {
    if (!newMemberEmail.trim() || !group || addingMember) return

    setAddingMember(true)
    try {
      const usersQuery = query(collection(db, "users"), where("email", "==", newMemberEmail.trim().toLowerCase()))
      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        toast({
          title: "Usuario no encontrado",
          description: "No existe un usuario registrado con ese email",
          variant: "destructive",
        })
        return
      }

      const userToAdd = usersSnapshot.docs[0]
      const userToAddId = userToAdd.id
      const userToAddData = userToAdd.data()

      if (group.members.includes(userToAddId)) {
        toast({
          title: "Ya es miembro",
          description: "Este usuario ya pertenece al grupo",
          variant: "destructive",
        })
        return
      }

      // Agregar miembro al grupo
      const groupRef = doc(db, "groups", group.id)
      await updateDoc(groupRef, {
        members: arrayUnion(userToAddId),
      })

      // Crear notificación para el nuevo miembro
      await createNotification({
        userId: userToAddId,
        type: "member_added",
        title: "Te agregaron a un grupo",
        message: `${user?.displayName || "Alguien"} te agregó al grupo "${group.name}"`,
        groupId: group.id,
        groupName: group.name,
      })

      // Actualizar datos de usuarios localmente
      setUsersData((prev) => ({
        ...prev,
        [userToAddId]: userToAddData,
      }))

      trackUserAction("member_added", {
        user_id: user?.uid,
        group_id: group.id,
        added_user_id: userToAddId,
      })

      toast({
        title: "¡Miembro agregado!",
        description: `${userToAddData.displayName || userToAddData.email} se unió al grupo`,
      })

      setNewMemberEmail("")
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el miembro",
        variant: "destructive",
      })
    } finally {
      setAddingMember(false)
    }
  }

  const shareGroup = async () => {
    if (!group || !user) return

    try {
      const invitationId = await createInvitation(group.id, user.uid)
      const shareUrl = `${window.location.origin}?invite=${invitationId}`

      if (navigator.share) {
        await navigator.share({
          title: `Únete al grupo "${group.name}"`,
          text: `Te invito a unirte a nuestro grupo de gastos compartidos en Vaquitapp`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "¡Enlace copiado!",
          description: "Comparte este enlace para invitar amigos al grupo",
        })
      }

      trackUserAction("group_shared", {
        user_id: user.uid,
        group_id: group.id,
        method: navigator.share ? "native_share" : "clipboard",
      })
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  const { balances, settlements, totalExpenses } = calculateGroupBalances(group.members, expenses, transfers)
  const userBalance = balances[user?.uid || ""] || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")} className="hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">{group.name}</h1>
          <p className="text-sm text-muted-foreground">{group.members.length} miembros</p>
        </div>
        <Button variant="outline" size="icon" onClick={shareGroup} className="hover:bg-primary/10 bg-transparent">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Balance del usuario */}
      <Card className="border-0 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tu balance en este grupo</p>
            <div className="text-3xl font-bold">
              {userBalance > 0 ? (
                <span className="text-green-600">+{formatCurrency(userBalance)}</span>
              ) : userBalance < 0 ? (
                <span className="text-red-600">{formatCurrency(userBalance)}</span>
              ) : (
                <span className="text-primary">{formatCurrency(0)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {userBalance > 0 ? "Te deben dinero" : userBalance < 0 ? "Debes dinero" : "Estás al día"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs">
            <Receipt className="h-3 w-3 mr-1" />
            Gastos
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Miembros
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-secondary">{formatCurrency(totalExpenses)}</div>
                <div className="text-xs text-muted-foreground">Total gastado</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-accent/10 to-accent/5">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-accent">{expenses.length}</div>
                <div className="text-xs text-muted-foreground">Gastos registrados</div>
              </CardContent>
            </Card>
          </div>

          {/* Transferencias sugeridas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Transferencias Sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-sm text-muted-foreground">¡Todo saldado!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {usersData[settlement.from]?.photoURL ? (
                            <Image
                              src={usersData[settlement.from].photoURL || "/placeholder.svg"}
                              alt="Profile"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{getUserDisplayName(settlement.from, usersData)}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          {usersData[settlement.to]?.photoURL ? (
                            <Image
                              src={usersData[settlement.to].photoURL || "/placeholder.svg"}
                              alt="Profile"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{getUserDisplayName(settlement.to, usersData)}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{formatCurrency(settlement.amount)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón para agregar gasto */}
          <Button
            onClick={() => onNavigate("add-expense", groupId)}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gasto
          </Button>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-lg font-semibold mb-2">Sin gastos aún</h3>
                <p className="text-sm text-muted-foreground mb-4">Agrega el primer gasto del grupo</p>
                <Button onClick={() => onNavigate("add-expense", groupId)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gasto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Historial de Gastos</h3>
                <Button size="sm" onClick={() => onNavigate("add-expense", groupId)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <Card
                    key={expense.id}
                    className="cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => onNavigate("expense-detail", groupId, expense.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {usersData[expense.paidBy]?.photoURL ? (
                            <Image
                              src={usersData[expense.paidBy].photoURL || "/placeholder.svg"}
                              alt="Profile"
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Pagado por {getUserDisplayName(expense.paidBy, usersData)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.createdAt?.toDate?.()?.toLocaleDateString() || "Fecha no disponible"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {/* Lista de miembros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Miembros del Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.members.map((memberId) => {
                const memberBalance = balances[memberId] || 0
                const userData = usersData[memberId]

                return (
                  <div key={memberId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {userData?.photoURL ? (
                        <Image
                          src={userData.photoURL || "/placeholder.svg"}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{getUserDisplayName(memberId, usersData)}</p>
                        <p className="text-xs text-muted-foreground">{userData?.email || "Email no disponible"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          memberBalance > 0 ? "text-green-600" : memberBalance < 0 ? "text-red-600" : "text-primary"
                        }`}
                      >
                        {memberBalance > 0 ? "+" : ""}
                        {formatCurrency(memberBalance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {memberBalance > 0 ? "Le deben" : memberBalance < 0 ? "Debe" : "Al día"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Agregar miembro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invitar Amigo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email del amigo"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={addingMember}
                  className="flex-1"
                />
                <Button onClick={addMember} disabled={addingMember || !newMemberEmail.trim()}>
                  {addingMember ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">O comparte el enlace del grupo</p>
                <Button variant="outline" onClick={shareGroup} className="w-full bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir Enlace
                </Button>
              </div>
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
