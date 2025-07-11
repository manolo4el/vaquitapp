"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, deleteDoc } from "firebase/firestore"
import { calculateBalancesWithTransfers, formatAmount } from "@/lib/calculations"
import { Plus, TrendingUp, TrendingDown, Users, Sparkles, Copy, Share, Trash2, Search, X } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { FriendsSelector } from "@/components/friends-selector"
import { useAnalytics } from "@/hooks/use-analytics"

interface Group {
  id: string
  name: string
  members: string[]
  createdBy: string
  createdAt: Date
}

interface EnhancedDashboardProps {
  onNavigate: (page: string, groupId?: string) => void
}

export function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreatedDialogOpen, setIsCreatedDialogOpen] = useState(false)
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)
  const [createdGroupName, setCreatedGroupName] = useState("")
  const [totalBalances, setTotalBalances] = useState({ youOwe: 0, theyOweYou: 0 })
  const [groupBalances, setGroupBalances] = useState<{ [groupId: string]: number }>({})
  const { trackGroupAction } = useAnalytics()

  // Filtrar grupos basado en el término de búsqueda
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups

    return groups.filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  }, [groups, searchTerm])

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Group,
      )
      setGroups(groupsData)
    })

    return unsubscribe
  }, [user])

  // Calcular balances totales cuando cambien los grupos
  useEffect(() => {
    if (!user || groups.length === 0) {
      setTotalBalances({ youOwe: 0, theyOweYou: 0 })
      return
    }

    const unsubscribes: (() => void)[] = []
    const balances: { [groupId: string]: number } = {}

    const calculateTotals = () => {
      let totalYouOwe = 0
      let totalTheyOweYou = 0

      Object.values(balances).forEach((balance) => {
        if (balance < 0) {
          totalYouOwe += -balance
        } else if (balance > 0) {
          totalTheyOweYou += balance
        }
      })

      setTotalBalances({ youOwe: totalYouOwe, theyOweYou: totalTheyOweYou })
      setGroupBalances({ ...balances })
    }

    groups.forEach((group) => {
      // Escuchar gastos
      const expensesUnsub = onSnapshot(collection(db, "groups", group.id, "expenses"), (expensesSnapshot) => {
        const expenses = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Escuchar transferencias
        const transfersUnsub = onSnapshot(collection(db, "groups", group.id, "transfers"), (transfersSnapshot) => {
          const transfers = transfersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          const groupBalances = calculateBalancesWithTransfers(group.members, expenses, transfers)
          const userBalance = groupBalances[user.uid] || 0

          balances[group.id] = userBalance
          calculateTotals()
        })

        unsubscribes.push(transfersUnsub)
      })

      unsubscribes.push(expensesUnsub)
    })

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [user, groups])

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return

    try {
      // Incluir al usuario actual y a los amigos seleccionados
      const members = [user.uid, ...selectedFriends]

      const docRef = await addDoc(collection(db, "groups"), {
        name: newGroupName,
        members,
        createdBy: user.uid,
        createdAt: new Date(),
      })

      // Guardar información del grupo creado
      setCreatedGroupId(docRef.id)
      setCreatedGroupName(newGroupName)

      setNewGroupName("")
      setSelectedFriends([])
      setIsDialogOpen(false)
      setIsCreatedDialogOpen(true)
      trackGroupAction("group_created", docRef.id, {
        group_name: newGroupName,
        member_count: members.length,
        has_friends: selectedFriends.length > 0,
      })

      toast({
        title: "¡Rebaño creado! 🐄",
        description: `"${newGroupName}" está listo con ${members.length} miembro${members.length !== 1 ? "s" : ""}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive",
      })
    }
  }

  const copyInviteLink = () => {
    if (!createdGroupId) return
    const shareUrl = `${window.location.origin}?join=${createdGroupId}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "¡Enlace copiado! 🔗",
      description: "Compártelo con tus amigos para que se unan al rebaño",
    })
  }

  const goToGroup = () => {
    if (createdGroupId) {
      setIsCreatedDialogOpen(false)
      onNavigate("group-details", createdGroupId)
    }
  }

  const deleteGroup = async (groupId: string, groupName: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, "groups", groupId))
      toast({
        title: "Grupo eliminado",
        description: `"${groupName}" ha sido eliminado exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  // Función para calcular el tamaño de fuente basado en la longitud del número
  const getFontSizeClass = (amount: number) => {
    const amountStr = formatAmount(amount)
    if (amountStr.length <= 8) return "text-2xl sm:text-3xl" // 1.234,56
    if (amountStr.length <= 10) return "text-xl sm:text-2xl" // 12.345,67
    if (amountStr.length <= 12) return "text-lg sm:text-xl" // 123.456,78
    return "text-base sm:text-lg" // Números muy largos
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header con saludo - Responsive */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex justify-center">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-bounce">
            <Image src="/cow-logo.svg" alt="Cow" width={40} height={40} className="opacity-80 sm:w-12 sm:h-12" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¡Hola, {user?.displayName?.split(" ")[0] || "Vaquero"}!
          </span>{" "}
          <span className="inline-block">🤠</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Bienvenido a tu rebaño de gastos</p>
      </div>

      {/* Resumen de balances totales - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-center text-lg sm:text-xl text-primary flex items-center justify-center gap-2">
            💰 Resumen General
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalBalances.youOwe === 0 && totalBalances.theyOweYou === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-6xl mb-4">🎉</div>
              <h3 className="text-xl sm:text-2xl font-bold text-accent-foreground mb-2">
                ¡No tenés deudas y todos te pagaron!
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">¡Sos el rey/reina del rebaño! 👑</p>
              <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-xl">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-accent-foreground font-medium">
                  ¡Perfecto equilibrio financiero! 🐄✨
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Botón Te deben - Responsive */}
              <Button
                onClick={() => onNavigate("debt-consolidation")}
                className="h-auto p-4 sm:p-6 bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/15 hover:to-accent/10 border border-accent/20 text-accent-foreground hover:text-accent-foreground"
                variant="outline"
              >
                <div className="text-center w-full">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <div className="text-xs sm:text-sm mb-1">Te deben en total</div>
                  <div className={`font-bold ${getFontSizeClass(totalBalances.theyOweYou)}`}>
                    ${formatAmount(totalBalances.theyOweYou)}
                  </div>
                  <div className="text-xs mt-1 sm:mt-2 opacity-70">Toca para ver detalles</div>
                </div>
              </Button>

              {/* Botón Debes - Responsive */}
              <Button
                onClick={() => onNavigate("debt-consolidation")}
                className="h-auto p-4 sm:p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:from-destructive/15 hover:to-destructive/10 border border-destructive/20 text-destructive hover:text-destructive"
                variant="outline"
              >
                <div className="text-center w-full">
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <div className="text-xs sm:text-sm mb-1">Debés en total</div>
                  <div className={`font-bold ${getFontSizeClass(totalBalances.youOwe)}`}>
                    ${formatAmount(totalBalances.youOwe)}
                  </div>
                  <div className="text-xs mt-1 sm:mt-2 opacity-70">Toca para ver detalles</div>
                </div>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de grupos con buscador */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Tus Rebaños 🐄</h2>

          {/* Buscador dinámico */}
          {groups.length > 0 && (
            <div className="relative flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-10 bg-background/50 border-primary/20 focus:border-primary"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mostrar resultados de búsqueda */}
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {filteredGroups.length === 0 ? (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                No se encontraron grupos que coincidan con "{searchTerm}"
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {filteredGroups.length} grupo{filteredGroups.length !== 1 ? "s" : ""} encontrado
                {filteredGroups.length !== 1 ? "s" : ""} para "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {groups.length === 0 ? (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
                <Users className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">¡Tu primer rebaño te espera!</h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4">
                Crea tu primer grupo para comenzar
              </p>
            </CardContent>
          </Card>
        ) : filteredGroups.length === 0 && searchTerm ? (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-muted/20 to-muted/10 rounded-full">
                <Search className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-muted-foreground mb-2">No hay resultados</h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4">
                No se encontraron grupos que coincidan con tu búsqueda
              </p>
              <Button variant="outline" onClick={clearSearch} className="mt-2 bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Limpiar búsqueda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredGroups.map((group) => (
              <GroupSummaryCard
                key={group.id}
                group={group}
                onNavigate={onNavigate}
                onDelete={deleteGroup}
                currentUserId={user?.uid || ""}
                userBalance={groupBalances[group.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog para crear grupo - Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-4 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-50"
            size="icon"
          >
            <Plus className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card/95 backdrop-blur-sm border-primary/20 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-primary flex items-center gap-2">
              🐄 Crear Nuevo Rebaño
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            {/* Nombre del grupo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Nombre del rebaño</label>
              <Input
                placeholder="Ej: Vacaciones en la playa, Cena del viernes..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createGroup()}
                className="h-10 sm:h-12 border-primary/20 focus:border-primary text-sm sm:text-base"
              />
            </div>

            {/* Selector de amigos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Invitar amigos (opcional)</label>
              <FriendsSelector
                selectedFriends={selectedFriends}
                onFriendsChange={setSelectedFriends}
                title="Invitar Amigos al Rebaño"
                description="Selecciona amigos con los que ya compartiste grupos"
                trigger={
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 border-primary/20 hover:bg-primary/10 justify-start bg-transparent text-sm sm:text-base"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {selectedFriends.length === 0
                      ? "Seleccionar amigos"
                      : `${selectedFriends.length} amigo${selectedFriends.length !== 1 ? "s" : ""} seleccionado${selectedFriends.length !== 1 ? "s" : ""}`}
                  </Button>
                }
              />
            </div>

            {/* Información adicional */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
              <div className="text-sm text-accent-foreground">
                <div className="font-medium mb-1">💡 Tip:</div>
                <div className="text-xs text-muted-foreground">
                  También podés crear el grupo solo y agregar amigos después, o compartir el enlace de invitación
                </div>
              </div>
            </div>

            <Button
              onClick={createGroup}
              disabled={!newGroupName.trim()}
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold text-sm sm:text-base"
            >
              ✨ Crear Rebaño
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para grupo creado - Responsive */}
      <Dialog open={isCreatedDialogOpen} onOpenChange={setIsCreatedDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-sm border-primary/20 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-primary flex items-center gap-2">
              🎉 ¡Rebaño Creado!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-accent-foreground mb-2">"{createdGroupName}"</div>
              <div className="text-sm text-muted-foreground">¡Tu nuevo rebaño está listo!</div>
            </div>

            <div className="space-y-3">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Share className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary mb-1 text-sm sm:text-base">¡Invita a más amigos!</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Comparte el enlace para que se unan al rebaño y puedan dividir gastos contigo
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={copyInviteLink}
                variant="outline"
                className="w-full h-10 sm:h-12 border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent text-sm sm:text-base"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar enlace de invitación
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={goToGroup}
                className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-sm sm:text-base"
              >
                Ir al grupo
              </Button>
              <Button
                onClick={() => setIsCreatedDialogOpen(false)}
                variant="outline"
                className="flex-1 h-10 sm:h-12 border-primary/20 hover:bg-primary/10 text-sm sm:text-base"
              >
                Después
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente para mostrar resumen de cada grupo - Mejorado responsive
function GroupSummaryCard({
  group,
  onNavigate,
  onDelete,
  currentUserId,
  userBalance,
}: {
  group: Group
  onNavigate: (page: string, groupId?: string) => void
  onDelete: (groupId: string, groupName: string) => void
  currentUserId: string
  userBalance: number
}) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const expensesUnsub = onSnapshot(collection(db, "groups", group.id, "expenses"), (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    const transfersUnsub = onSnapshot(collection(db, "groups", group.id, "transfers"), (snapshot) => {
      setTransfers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    // Cargar datos de usuarios
    if (group.members && group.members.length > 0) {
      Promise.all(group.members.map((uid) => getDoc(doc(db, "users", uid)))).then((snaps) => {
        const data: any = {}
        snaps.forEach((snap) => {
          if (snap.exists()) data[snap.id] = snap.data()
        })
        setUsersData(data)
      })
    }

    return () => {
      expensesUnsub()
      transfersUnsub()
    }
  }, [group.id, group.members])

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Verificar si el grupo está saldado usando el balance calculado
  const isSettled = Math.abs(userBalance) < 0.01 && totalExpenses > 0

  // Verificar si el usuario actual es el creador del grupo
  const isCreator = group.createdBy === currentUserId

  const handleDelete = () => {
    onDelete(group.id, group.name)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-secondary/5 relative"
        onClick={() => onNavigate("group-details", group.id)}
      >
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
                <span className="truncate">{group.name}</span>
                {isSettled && (
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-xs flex-shrink-0">
                    ✅ Saldado
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">Total: ${formatAmount(totalExpenses)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground text-xs">
                <Users className="h-3 w-3 mr-1" />
                {group.members.length}
              </Badge>
              {/* Botón de eliminar alineado con el badge */}
              {isCreator && isSettled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(true)
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground">Tu balance</div>
              <div
                className={`text-base sm:text-lg font-bold ${
                  userBalance > 0 ? "text-accent-foreground" : userBalance < 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {userBalance > 0 ? "+" : ""}${formatAmount(userBalance)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate("add-expense", group.id)
              }}
              className="border-primary/20 hover:bg-primary/10 h-8 px-3 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Gasto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación para eliminar - Responsive */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5" />
              Eliminar Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 sm:p-4 bg-destructive/10 rounded-xl">
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro que querés eliminar <strong>"{group.name}"</strong>?
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Esta acción no se puede deshacer. Se eliminarán todos los gastos y el historial del grupo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-10 text-sm">
                Cancelar
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="flex-1 h-10 text-sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
