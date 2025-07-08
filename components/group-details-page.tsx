"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, orderBy, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Users, Receipt, Share2, DollarSign } from "lucide-react"
import { GroupChat } from "./group-chat"
import { calculateBalances, getUserDisplayName } from "@/lib/calculations"
import { createGroupInvitation } from "@/lib/invitations"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  description?: string
  members: string[]
  createdBy: string
  createdAt: any
  currency: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: any
  groupId: string
  category?: string
}

interface GroupDetailsPageProps {
  groupId: string
  onNavigate: (page: string, param?: string) => void
}

export function GroupDetailsPage({ groupId, onNavigate }: GroupDetailsPageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<any>({})

  useEffect(() => {
    if (!groupId) return

    // Suscribirse a los datos del grupo
    const groupUnsubscribe = onSnapshot(doc(db, "groups", groupId), async (doc) => {
      if (doc.exists()) {
        const groupData = { id: doc.id, ...doc.data() } as Group
        setGroup(groupData)

        // Cargar datos de usuarios del grupo
        const usersDataMap: any = {}
        await Promise.all(
          groupData.members.map(async (memberId) => {
            try {
              const userDoc = await getDoc(doc(db, "users", memberId))
              if (userDoc.exists()) {
                usersDataMap[memberId] = userDoc.data()
              }
            } catch (error) {
              console.error(`Error loading user ${memberId}:`, error)
            }
          }),
        )
        setUsersData(usersDataMap)
      }
    })

    // Suscribirse a los gastos del grupo
    const expensesQuery = query(collection(db, "expenses"), where("groupId", "==", groupId), orderBy("date", "desc"))

    const expensesUnsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]

      setExpenses(expensesData)
      setLoading(false)
    })

    return () => {
      groupUnsubscribe()
      expensesUnsubscribe()
    }
  }, [groupId])

  useEffect(() => {
    if (group && expenses.length > 0) {
      const calculatedBalances = calculateBalances(expenses, group.members)
      setBalances(calculatedBalances)
    }
  }, [group, expenses])

  const handleShareGroup = async () => {
    if (!group || !user) return

    try {
      const invitationId = await createGroupInvitation(group.id, user.uid)
      const shareUrl = `${window.location.origin}?invite=${invitationId}`

      if (navigator.share) {
        await navigator.share({
          title: `Únete al grupo "${group.name}"`,
          text: `Te invito a unirte a mi grupo de gastos en Vaquitapp`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Enlace copiado al portapapeles")
      }
    } catch (error) {
      console.error("Error sharing group:", error)
      toast.error("Error al compartir el grupo")
    }
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const userBalance = balances[user?.uid || ""] || 0

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
                <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
                <p className="text-sm text-gray-600">{group.members.length} miembros</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShareGroup}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigate("add-expense", groupId)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Gasto
              </Button>
            </div>
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
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {group.currency}{" "}
                    {totalExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gastos</p>
                  <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${userBalance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <DollarSign className={`h-6 w-6 ${userBalance >= 0 ? "text-green-600" : "text-red-600"}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tu Balance</p>
                  <p className={`text-2xl font-bold ${userBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {group.currency}{" "}
                    {Math.abs(userBalance).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">{userBalance >= 0 ? "Te deben" : "Debes"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            {expenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay gastos aún</h4>
                  <p className="text-gray-600 mb-4">Agrega el primer gasto para empezar a dividir los costos</p>
                  <Button onClick={() => onNavigate("add-expense", groupId)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Gasto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <Card
                    key={expense.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigate("expense-detail", expense.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={usersData[expense.paidBy]?.photoURL || "/placeholder.svg"} />
                            <AvatarFallback>{getUserDisplayName(expense.paidBy, usersData).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-gray-900">{expense.description}</h4>
                            <p className="text-sm text-gray-600">
                              Pagado por {getUserDisplayName(expense.paidBy, usersData)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {expense.date?.toDate?.()?.toLocaleDateString() || "Fecha no disponible"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {group.currency}{" "}
                            {expense.amount.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {expense.splitBetween.length} {expense.splitBetween.length === 1 ? "persona" : "personas"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Miembros del Grupo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.members.map((memberId) => {
                  const memberBalance = balances[memberId] || 0
                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={usersData[memberId]?.photoURL || "/placeholder.svg"} />
                          <AvatarFallback>{getUserDisplayName(memberId, usersData).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{getUserDisplayName(memberId, usersData)}</p>
                          {memberId === group.createdBy && (
                            <Badge variant="secondary" className="text-xs">
                              Administrador
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${memberBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {group.currency}{" "}
                          {Math.abs(memberBalance).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">{memberBalance >= 0 ? "Le deben" : "Debe"}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <GroupChat groupId={groupId} usersData={usersData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
