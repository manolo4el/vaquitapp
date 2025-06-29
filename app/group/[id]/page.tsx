"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Send,
  Receipt,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  Share2,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { calculateExpensesAndTransfers, formatAmount } from "@/lib/expense-calculator"
import { getGroupById, addMessageToGroup, getGroupMessages, isUserMemberOfGroup } from "@/lib/group-storage"
import type { Group, GroupMessage } from "@/lib/group-storage"
import DebtModal from "@/components/debt-modal"
import { getCurrentUser } from "@/lib/auth"
import DebtLiquidationModal from "@/components/debt-liquidation-modal"
import { AuthGuard } from "@/components/auth-guard"
import ShareGroupModal from "@/components/share-group-modal"

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [selectedDebt, setSelectedDebt] = useState<any>(null)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    console.log("=== INICIANDO CARGA DE GRUPO ===")
    console.log("Group ID:", params.id)
    setIsLoading(true)

    try {
      // ✅ Verificar usuario actual con debugging detallado
      const user = getCurrentUser()
      console.log("Usuario actual obtenido:", user)

      if (!user) {
        console.error("❌ No hay usuario autenticado")
        setError("Debes iniciar sesión para ver este grupo")
        setIsLoading(false)
        return
      }

      console.log("✅ Usuario autenticado:", user.name, "ID:", user.id)
      setCurrentUser(user)

      // ✅ Cargar datos del grupo con debugging
      console.log("Cargando grupo con ID:", params.id)
      const groupData = getGroupById(params.id)
      console.log("Datos del grupo obtenidos:", groupData)

      if (groupData) {
        console.log("✅ Grupo encontrado:", groupData.name)
        console.log(
          "Miembros del grupo:",
          groupData.members.map((m) => ({ id: m.id, name: m.name })),
        )

        // ✅ Verificar membresía con debugging detallado
        const isMember = isUserMemberOfGroup(params.id, user.id)
        console.log("¿Es miembro del grupo?", isMember)
        console.log("Verificando membresía para usuario ID:", user.id)
        console.log(
          "IDs de miembros:",
          groupData.members.map((m) => m.id),
        )

        if (!isMember) {
          console.error("❌ Usuario no es miembro del grupo")
          setError("No tienes acceso a este grupo")
          setIsLoading(false)
          return
        }

        console.log("✅ Usuario es miembro del grupo")
        setGroup(groupData)

        // Cargar mensajes del grupo
        const groupMessages = getGroupMessages(params.id)
        console.log("Mensajes del grupo cargados:", groupMessages.length)
        setMessages(groupMessages)

        setError("")
      } else {
        console.error("❌ Grupo no encontrado")
        setError("Grupo no encontrado")
      }
    } catch (err) {
      console.error("❌ Error al cargar grupo:", err)
      setError("Error al cargar el grupo")
    } finally {
      setIsLoading(false)
      console.log("=== FIN CARGA DE GRUPO ===")
    }
  }, [params.id])

  // Recalcular cuando cambie el grupo
  useEffect(() => {
    if (!group || !currentUser) return

    const interval = setInterval(() => {
      try {
        const updatedGroup = getGroupById(params.id)
        if (updatedGroup && JSON.stringify(updatedGroup) !== JSON.stringify(group)) {
          console.log("Actualizando datos del grupo")
          setGroup(updatedGroup)

          // Actualizar mensajes también
          const updatedMessages = getGroupMessages(params.id)
          setMessages(updatedMessages)
        }
      } catch (err) {
        console.error("Error al actualizar grupo:", err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [params.id, group, currentUser])

  // Calcular balances y transferencias usando el algoritmo real
  const calculations = useMemo(() => {
    if (!group) return { balances: [], transfers: [], totalExpenses: 0 }
    return calculateExpensesAndTransfers(group.expenses, group.members)
  }, [group])

  const handleBack = () => {
    window.location.href = "/dashboard"
  }

  const handleAddExpense = () => {
    window.location.href = `/group/${params.id}/add-expense`
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || isSendingMessage) return

    setIsSendingMessage(true)
    try {
      await addMessageToGroup(params.id, newMessage)

      // Actualizar mensajes localmente
      const updatedMessages = getGroupMessages(params.id)
      setMessages(updatedMessages)

      setNewMessage("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getBalanceColor = (status: string) => {
    switch (status) {
      case "owed":
        return "text-lime-600"
      case "owes":
        return "text-orange-600"
      case "settled":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  const getBalanceIcon = (status: string) => {
    switch (status) {
      case "owed":
        return <TrendingUp className="w-4 h-4" />
      case "owes":
        return <TrendingDown className="w-4 h-4" />
      case "settled":
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getMemberNames = (memberIds: string[]) => {
    if (!group) return ""
    return memberIds
      .map((id) => group.members.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const handleDebtClick = (transfer: any) => {
    // Solo mostrar modal si el usuario actual debe dinero
    if (transfer.from.id === currentUser?.id) {
      // Buscar información del acreedor incluyendo su alias
      const creditor = group?.members.find((m) => m.id === transfer.to.id)

      setSelectedDebt({
        amount: transfer.amount,
        creditor: {
          id: transfer.to.id,
          name: transfer.to.name,
          avatar: creditor?.avatar,
          alias: creditor?.alias || "",
        },
      })
      setIsDebtModalOpen(true)
    }
  }

  const handleLiquidateDebts = (debtorId: string) => {
    if (!group || !currentUser) return

    // Encontrar todas las deudas del usuario deudor
    const debtorTransfers = calculations.transfers.filter((transfer) => transfer.from.id === debtorId)

    if (debtorTransfers.length === 0) return

    // Obtener información del deudor
    const debtor = group.members.find((m) => m.id === debtorId)
    if (!debtor) return

    // Mapear las deudas con información completa de los acreedores
    const debts = debtorTransfers.map((transfer) => {
      const creditor = group.members.find((m) => m.id === transfer.to.id)
      return {
        creditor: {
          id: transfer.to.id,
          name: transfer.to.name,
          avatar: creditor?.avatar,
          alias: creditor?.alias || "",
        },
        amount: transfer.amount,
      }
    })

    setSelectedDebtor({
      id: debtor.id,
      name: debtor.name,
      avatar: debtor.avatar,
    })

    setIsLiquidationModalOpen(true)
  }

  const handleTransferMarked = () => {
    // Recargar datos del grupo para reflejar los cambios
    try {
      const updatedGroup = getGroupById(params.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (err) {
      console.error("Error al actualizar grupo:", err)
    }
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando grupo...</p>
          <p className="text-sm text-gray-500 mt-2">ID: {params.id}</p>
          <p className="text-xs text-blue-500 mt-1">Usuario: {currentUser ? currentUser.name : "Verificando..."}</p>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error al cargar grupo</h2>
            <p className="text-gray-600 mb-4">{error || "El grupo no existe o no se pudo cargar"}</p>
            <p className="text-sm text-gray-500 mb-2">ID buscado: {params.id}</p>
            <p className="text-xs text-blue-500 mb-4">Usuario: {currentUser ? currentUser.name : "No autenticado"}</p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {group.members.length} miembros • Total: {formatAmount(calculations.totalExpenses)}
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsShareModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="bg-white/50 hover:bg-white/80 border-lime-300 text-lime-700 hover:text-lime-800"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Sección de Gastos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-lime-500" />
                Gastos del grupo
              </h2>
              <Button
                onClick={handleAddExpense}
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar gasto
              </Button>
            </div>

            <div className="space-y-4">
              {group.expenses.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Receipt className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No hay gastos todavía</h3>
                    <p className="text-gray-500 mb-4">Agrega el primer gasto para empezar a dividir</p>
                    <Button
                      onClick={handleAddExpense}
                      className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar gasto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                group.expenses.map((expense) => (
                  <Card
                    key={expense.id}
                    className="bg-white/70 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{expense.title}</h3>
                          {expense.description && <p className="text-sm text-gray-600 mb-2">{expense.description}</p>}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Pagó: <strong>{expense.paidBy.name}</strong>
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(expense.date)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Repartido entre: {getMemberNames(expense.splitBetween)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">{formatAmount(expense.amount)}</p>
                          <p className="text-sm text-gray-500">
                            {formatAmount(expense.amount / expense.splitBetween.length)} c/u
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Sección de Saldos - Solo mostrar si hay gastos */}
          {group.expenses.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-lime-500" />
                Saldos del grupo
              </h2>

              <Card className="bg-white/70 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {calculations.balances.map((balance) => (
                      <div key={balance.userId} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={group.members.find((m) => m.id === balance.userId)?.avatar || "/placeholder.svg"}
                              alt={balance.name}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-lime-400 to-violet-400 text-white text-xs">
                              {balance.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-800">{balance.name}</span>
                        </div>
                        <div className={`flex items-center space-x-1 font-semibold ${getBalanceColor(balance.status)}`}>
                          {getBalanceIcon(balance.status)}
                          <span className="text-sm">
                            {balance.balance === 0
                              ? "Saldado"
                              : balance.balance > 0
                                ? `+${formatAmount(balance.balance)}`
                                : formatAmount(balance.balance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Sección: Deudas del Grupo */}
          {calculations.transfers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <ArrowRight className="w-5 h-5 mr-2 text-violet-500" />
                Deudas del Grupo
              </h2>

              <Card className="bg-gradient-to-r from-violet-50 to-lime-50 border-violet-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-4">Resumen de deudas por usuario:</p>
                  <div className="space-y-3">
                    {/* Agrupar transferencias por deudor */}
                    {Object.entries(
                      calculations.transfers.reduce((acc, transfer) => {
                        const debtorId = transfer.from.id
                        if (!acc[debtorId]) {
                          acc[debtorId] = {
                            debtor: transfer.from,
                            totalDebt: 0,
                            transferCount: 0,
                          }
                        }
                        acc[debtorId].totalDebt += transfer.amount
                        acc[debtorId].transferCount += 1
                        return acc
                      }, {} as any),
                    ).map(([debtorId, debtInfo]: [string, any]) => (
                      <div
                        key={debtorId}
                        className="flex items-center justify-between bg-white/70 rounded-lg p-4 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={group.members.find((m) => m.id === debtorId)?.avatar || "/placeholder.svg"}
                              alt={debtInfo.debtor.name}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-lime-400 to-violet-400 text-white text-sm">
                              {debtInfo.debtor.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-800">{debtInfo.debtor.name}</p>
                            <p className="text-sm text-gray-500">
                              Debe a {debtInfo.transferCount} persona{debtInfo.transferCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg text-orange-600">{formatAmount(debtInfo.totalDebt)}</p>
                            <p className="text-sm text-gray-500">Total adeudado</p>
                          </div>
                          <Button
                            onClick={() => handleLiquidateDebts(debtorId)}
                            className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
                          >
                            Liquidar deudas
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-lime-50 rounded-lg border border-lime-200">
                    <p className="text-sm text-lime-700 font-medium">
                      ✅ Con solo {calculations.transfers.length} transferencia
                      {calculations.transfers.length > 1 ? "s" : ""}, todos quedan saldados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Sección de Chat */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-violet-500" />
              Chat del grupo
            </h2>

            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                {/* Mensajes */}
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Todavía no hay mensajes</h3>
                      <p className="text-gray-500 text-sm">Sé el primero en escribir algo al grupo</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex space-x-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={message.userAvatar || "/placeholder.svg"} alt={message.userName} />
                          <AvatarFallback className="bg-gradient-to-r from-lime-400 to-violet-400 text-white text-xs">
                            {message.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-800">{message.userName}</span>
                            <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input para nuevo mensaje */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                    disabled={isSendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
                  >
                    {isSendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Modal de deuda */}
        <DebtModal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} debt={selectedDebt} />

        {/* Modal de liquidación de deudas */}
        <DebtLiquidationModal
          isOpen={isLiquidationModalOpen}
          onClose={() => setIsLiquidationModalOpen(false)}
          groupId={params.id}
          debtor={selectedDebtor}
          debts={
            selectedDebtor && group
              ? calculations.transfers
                  .filter((transfer) => transfer.from.id === selectedDebtor.id)
                  .map((transfer) => {
                    const creditor = group.members.find((m) => m.id === transfer.to.id)
                    return {
                      creditor: {
                        id: transfer.to.id,
                        name: transfer.to.name,
                        avatar: creditor?.avatar,
                        alias: creditor?.alias || "",
                      },
                      amount: transfer.amount,
                    }
                  })
              : []
          }
          totalDebt={
            selectedDebtor
              ? calculations.transfers
                  .filter((transfer) => transfer.from.id === selectedDebtor.id)
                  .reduce((sum, transfer) => sum + transfer.amount, 0)
              : 0
          }
          onTransferMarked={handleTransferMarked}
        />

        {/* Modal de compartir grupo */}
        <ShareGroupModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          group={{
            id: group.id,
            name: group.name,
            inviteCode: group.inviteCode || "",
            memberCount: group.members.length,
          }}
        />
      </div>
    </AuthGuard>
  )
}
