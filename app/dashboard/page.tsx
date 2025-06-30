"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, TrendingUp, TrendingDown, CheckCircle, Calendar, Users, LogOut, User } from "lucide-react"
import { getUserBalance, formatAmount } from "@/lib/expense-calculator"
import { getUserGroups } from "@/lib/group-storage" // ✅ Usar función específica para usuario
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { getConsolidatedDebts, formatDebtsForModal, formatCreditsForModal } from "@/lib/debt-calculator"
import DebtsOwedModal from "@/components/debts-owed-modal"
import DebtsOweModal from "@/components/debts-owe-modal"

export default function DashboardPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [consolidatedData, setConsolidatedData] = useState<any>(null)
  const [isOwedModalOpen, setIsOwedModalOpen] = useState(false)
  const [isOweModalOpen, setIsOweModalOpen] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user) return

    loadDashboardData()
  }, [user])

  const loadDashboardData = () => {
    try {
      // ✅ Cargar solo grupos del usuario actual (sin datos mock)
      const userGroups = getUserGroups() // Función que filtra por usuario actual
      console.log("Grupos del usuario cargados:", userGroups)

      // Calcular balances para cada grupo
      const groupsWithBalances = userGroups.map((group) => {
        const userBalance = getUserBalance(group.expenses, user!.id)
        let status: "owed" | "owes" | "settled" = "settled"

        if (userBalance > 0.01) status = "owed"
        else if (userBalance < -0.01) status = "owes"

        return {
          id: group.id,
          name: group.name,
          createdAt: group.createdAt,
          balance: userBalance,
          status,
          memberCount: group.members.length,
        }
      })

      setGroups(groupsWithBalances)

      // ✅ Calcular deudas consolidadas
      const consolidated = getConsolidatedDebts()
      console.log("Deudas consolidadas:", consolidated)
      setConsolidatedData(consolidated)
    } catch (error) {
      console.error("Error al cargar grupos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGroupClick = (groupId: string) => {
    console.log(`Navegando al grupo ${groupId}`)
    window.location.href = `/group/${groupId}`
  }

  const handleCreateGroup = () => {
    window.location.href = "/create-group"
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleViewGroup = (groupId: string) => {
    window.location.href = `/group/${groupId}`
  }

  const handleTransferMarked = () => {
    // Recargar datos del dashboard
    loadDashboardData()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
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

  const getBalanceText = (balance: number, status: string) => {
    if (status === "settled") return "Saldado"
    return status === "owed" ? `+${formatAmount(balance)}` : formatAmount(balance)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "owed":
        return "Te deben"
      case "owes":
        return "Debes"
      case "settled":
        return ""
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando grupos...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <VaquitappLogo size="md" showText={true} />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/profile")}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <User className="w-5 h-5" />
                </Button>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full p-2 hover:bg-gray-100">
                  <LogOut className="w-5 h-5" />
                </Button>

                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "Usuario"} />
                  <AvatarFallback className="bg-gradient-to-r from-lime-400 to-violet-400 text-white text-sm">
                    {(user?.name || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Saludo y botón crear grupo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Hola, {user?.name || "Usuario"}!</h1>
            <p className="text-gray-600 mb-4">Gestiona tus gastos compartidos</p>

            <Button
              onClick={handleCreateGroup}
              className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6 px-8 text-lg font-medium rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo grupo
            </Button>
          </div>

          {/* ✅ Lista de grupos - Solo grupos reales del usuario */}
          <div className="space-y-4">
            {groups.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes grupos todavía</h3>
                  <p className="text-gray-500 mb-4">Crea tu primer grupo para empezar a dividir gastos</p>
                  <Button
                    onClick={handleCreateGroup}
                    className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear grupo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              groups.map((group: any) => (
                <Card
                  key={group.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90"
                  onClick={() => handleGroupClick(group.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {group.memberCount}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(group.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`flex items-center space-x-1 font-semibold text-lg ${getBalanceColor(group.status)}`}
                        >
                          {getBalanceIcon(group.status)}
                          <span>{getBalanceText(group.balance, group.status)}</span>
                        </div>
                        <p className={`text-sm ${getBalanceColor(group.status)}`}>{getStatusText(group.status)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* ✅ Resumen rápido INTERACTIVO - Solo si hay grupos */}
          {groups.length > 0 && consolidatedData && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Te deben - CLICKEABLE */}
              <Card
                className="bg-lime-50 border-lime-200 hover:bg-lime-100 transition-colors cursor-pointer"
                onClick={() => consolidatedData.totalOwed > 0 && setIsOwedModalOpen(true)}
              >
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-lime-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-lime-600">{formatAmount(consolidatedData.totalOwed)}</p>
                  <p className="text-sm text-lime-700">Te deben</p>
                  {consolidatedData.totalOwed > 0 && (
                    <p className="text-xs text-lime-600 mt-1">Click para ver detalle</p>
                  )}
                </CardContent>
              </Card>

              {/* Debes - CLICKEABLE */}
              <Card
                className="bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                onClick={() => consolidatedData.totalOwing > 0 && setIsOweModalOpen(true)}
              >
                <CardContent className="p-4 text-center">
                  <TrendingDown className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">{formatAmount(consolidatedData.totalOwing)}</p>
                  <p className="text-sm text-orange-700">Debes</p>
                  {consolidatedData.totalOwing > 0 && (
                    <p className="text-xs text-orange-600 mt-1">Click para liquidar</p>
                  )}
                </CardContent>
              </Card>

              {/* Saldados */}
              <Card className="bg-violet-50 border-violet-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-violet-600">
                    {groups.filter((g) => g.status === "settled").length}
                  </p>
                  <p className="text-sm text-violet-700">Saldados</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ✅ Modales interactivos */}
        {consolidatedData && (
          <>
            {/* Modal "Te deben" */}
            <DebtsOwedModal
              isOpen={isOwedModalOpen}
              onClose={() => setIsOwedModalOpen(false)}
              debts={formatCreditsForModal(consolidatedData.credits)}
              totalOwed={consolidatedData.totalOwed}
              onViewGroup={handleViewGroup}
            />

            {/* Modal "Debes" */}
            <DebtsOweModal
              isOpen={isOweModalOpen}
              onClose={() => setIsOweModalOpen(false)}
              debts={formatDebtsForModal(consolidatedData.debts)}
              totalOwed={consolidatedData.totalOwing}
              onTransferMarked={handleTransferMarked}
            />
          </>
        )}
      </div>
    </AuthGuard>
  )
}
