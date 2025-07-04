"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, getDoc, addDoc, updateDoc, getDocs, writeBatch } from "firebase/firestore"
import { calculateBalancesWithTransfers, efficientTransfers, getUserDisplayName } from "@/lib/calculations"
import {
  ArrowLeft,
  Users,
  ArrowRight,
  Copy,
  CreditCard,
  Receipt,
  Share,
  Plus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { FriendsSelector } from "@/components/friends-selector"
import { GroupChat } from "@/components/group-chat"
import Image from "next/image"
import { useAnalytics } from "@/hooks/use-analytics"

interface GroupDetailsPageProps {
  groupId: string
  onNavigate: (page: string, groupId?: string, expenseId?: string) => void
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
  const [group, setGroup] = useState<any>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [balances, setBalances] = useState<any>({})
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [userSettlements, setUserSettlements] = useState<Settlement[]>([])
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [showIncludeInExpensesDialog, setShowIncludeInExpensesDialog] = useState(false)
  const [pendingNewMembers, setPendingNewMembers] = useState<string[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const { trackGroupAction, trackUserAction } = useAnalytics()

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return

      // Escuchar cambios en el documento del grupo
      const groupUnsub = onSnapshot(doc(db, "groups", groupId), async (groupDoc) => {
        if (groupDoc.exists()) {
          const groupData = { id: groupDoc.id, ...groupDoc.data() }
          setGroup(groupData)

          // Cargar datos de usuarios (incluyendo nuevos miembros)
          const usersPromises = groupData.members.map((uid: string) => getDoc(doc(db, "users", uid)))
          const usersSnaps = await Promise.all(usersPromises)
          const usersDataMap: any = {}
          usersSnaps.forEach((snap) => {
            if (snap.exists()) {
              usersDataMap[snap.id] = snap.data()
            }
          })
          setUsersData(usersDataMap)
        }
      })

      // Escuchar cambios en gastos
      const expensesUnsub = onSnapshot(collection(db, "groups", groupId, "expenses"), (snapshot) => {
        const expensesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[]
        setExpenses(expensesData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()))
      })

      // Escuchar cambios en transferencias
      const transfersUnsub = onSnapshot(collection(db, "groups", groupId, "transfers"), (snapshot) => {
        const transfersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transfer[]
        setTransfers(transfersData.sort((a, b) => b.confirmedAt?.toDate() - a.confirmedAt?.toDate()))
      })

      return () => {
        groupUnsub()
        expensesUnsub()
        transfersUnsub()
      }
    }

    loadGroupData()
  }, [groupId])

  useEffect(() => {
    if (group && expenses.length >= 0) {
      const calculatedBalances = calculateBalancesWithTransfers(group.members, expenses, transfers)
      setBalances(calculatedBalances)

      const calculatedSettlements = efficientTransfers(calculatedBalances)
      setSettlements(calculatedSettlements)

      // Filtrar liquidaciones donde el usuario actual debe dinero
      const userDebts = calculatedSettlements.filter((settlement) => settlement.from === user?.uid)
      setUserSettlements(userDebts)
    }
  }, [group, expenses, transfers, user])

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

      trackUserAction("transfer_confirmed", {
        amount: settlement.amount,
        group_id: groupId,
        to_user: settlement.to,
      })

      toast({
        title: "¡Transferencia confirmada! 💸",
        description: `Se registró el pago de $${settlement.amount.toFixed(2)} a ${getUserDisplayName(settlement.to, usersData)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transferencia",
        variant: "destructive",
      })
    }
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const shareGroup = async () => {
    const shareUrl = `${window.location.origin}?join=${groupId}`
    const shareText = "¡Te invitaron a un rebaño! Comparte este enlace para invitar amigos al rebaño"

    // Intentar usar la Web Share API nativa si está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al rebaño: ${group.name}`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (error) {
        // Si el usuario cancela o hay error, mostrar el dialog manual
        console.log("Share cancelled or failed:", error)
      }
    }

    // Fallback: mostrar dialog personalizado
    setShowShareDialog(true)
    trackGroupAction("group_share_attempted", groupId, {
      share_method: navigator.share ? "native" : "manual",
    })
  }

  const copyToClipboardShare = async () => {
    const shareUrl = `${window.location.origin}?join=${groupId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "¡Enlace copiado! 🔗",
        description: "Comparte este enlace para invitar amigos al rebaño",
      })
      setShowShareDialog(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const shareViaWhatsApp = () => {
    const shareUrl = `${window.location.origin}?join=${groupId}`
    const message = encodeURIComponent(
      `¡Te invito al rebaño "${group.name}" en Vaquitapp! 🐄\n\nÚnete aquí: ${shareUrl}`,
    )
    window.open(`https://wa.me/?text=${message}`, "_blank")
    setShowShareDialog(false)
  }

  const shareViaTelegram = () => {
    const shareUrl = `${window.location.origin}?join=${groupId}`
    const message = encodeURIComponent(
      `¡Te invito al rebaño "${group.name}" en Vaquitapp! 🐄\n\nÚnete aquí: ${shareUrl}`,
    )
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${message}`, "_blank")
    setShowShareDialog(false)
  }

  const shareViaEmail = () => {
    const shareUrl = `${window.location.origin}?join=${groupId}`
    const subject = encodeURIComponent(`Invitación al rebaño: ${group.name}`)
    const body = encodeURIComponent(
      `¡Hola!\n\nTe invito a unirte al rebaño "${group.name}" en Vaquitapp para dividir gastos juntos. 🐄\n\nHaz clic en este enlace para unirte:\n${shareUrl}\n\n¡Nos vemos en el rebaño!`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
    setShowShareDialog(false)
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

      // Si se debe incluir en gastos existentes, actualizar todos los gastos
      if (includeInExistingExpenses && expenses.length > 0) {
        const batch = writeBatch(db)

        // Obtener todos los gastos del grupo
        const expensesSnapshot = await getDocs(collection(db, "groups", groupId, "expenses"))

        expensesSnapshot.docs.forEach((expenseDoc) => {
          const expenseData = expenseDoc.data()
          const currentParticipants = expenseData.participants || group.members

          // Agregar los nuevos miembros a los participantes de cada gasto
          const updatedParticipants = [...new Set([...currentParticipants, ...pendingNewMembers])]

          batch.update(expenseDoc.ref, {
            participants: updatedParticipants,
          })
        })

        await batch.commit()

        toast({
          title: "¡Miembros agregados! 👥",
          description: `Se agregaron ${pendingNewMembers.length} nuevo${pendingNewMembers.length !== 1 ? "s" : ""} miembro${pendingNewMembers.length !== 1 ? "s" : ""} al rebaño y se incluyeron en todos los gastos existentes`,
        })
      } else {
        toast({
          title: "¡Miembros agregados! 👥",
          description: `Se agregaron ${pendingNewMembers.length} nuevo${pendingNewMembers.length !== 1 ? "s" : ""} miembro${pendingNewMembers.length !== 1 ? "s" : ""} al rebaño`,
        })
      }

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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header - Responsive */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="border-primary/20 hover:bg-primary/10 h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 truncate">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">{group.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {group.members.length} miembros • ${totalExpenses.toFixed(2)} total
          </p>
        </div>
        <Button
          onClick={() => onNavigate("add-expense", groupId)}
          className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground h-9 px-3 sm:h-10 sm:px-4 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Agregar</span>
          <span className="hidden sm:inline"> Gasto</span>
        </Button>
      </div>

      {/* Gestionar miembros - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-full">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-accent-foreground text-sm sm:text-base">Gestionar miembros</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Invitar amigos o compartir enlace</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <FriendsSelector
                selectedFriends={selectedNewMembers}
                onFriendsChange={setSelectedNewMembers}
                title="Agregar Amigos al Grupo"
                description="Selecciona amigos para agregar a este rebaño"
                trigger={
                  <Button
                    variant="outline"
                    className="flex-1 border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent h-9 sm:h-10 text-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Agregar Amigos
                  </Button>
                }
              />

              <Button
                onClick={shareGroup}
                variant="outline"
                className="border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent h-9 sm:h-10 text-sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </div>

            {selectedNewMembers.length > 0 && (
              <Button
                onClick={handleAddMembersClick}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary h-9 sm:h-10 text-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Agregar {selectedNewMembers.length} miembro{selectedNewMembers.length !== 1 ? "s" : ""} al grupo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para incluir en gastos existentes */}
      <Dialog open={showIncludeInExpensesDialog} onOpenChange={setShowIncludeInExpensesDialog}>
        <DialogContent className="max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incluir en gastos existentes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="text-center space-y-2">
                <div className="text-primary font-medium">
                  Este grupo ya tiene {expenses.length} gasto{expenses.length !== 1 ? "s" : ""} registrado
                  {expenses.length !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  ¿Quieres incluir a {pendingNewMembers.length > 1 ? "los nuevos miembros" : "el nuevo miembro"} en las
                  deudas ya generadas?
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <div className="font-medium text-accent-foreground text-sm mb-1">✅ Si incluyo:</div>
                <div className="text-xs text-muted-foreground">
                  {pendingNewMembers.length > 1 ? "Los nuevos miembros" : "El nuevo miembro"} participará en todos los
                  gastos existentes y las deudas se redistribuirán entre más personas.
                </div>
              </div>

              <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="font-medium text-secondary-foreground text-sm mb-1">❌ Si no incluyo:</div>
                <div className="text-xs text-muted-foreground">
                  {pendingNewMembers.length > 1 ? "Los nuevos miembros" : "El nuevo miembro"} solo participará en gastos
                  futuros. Las deudas actuales quedan como están.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => addMembersToGroup(true)}
                className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Sí, incluir en gastos existentes
              </Button>
              <Button
                onClick={() => addMembersToGroup(false)}
                variant="outline"
                className="w-full border-secondary/30 hover:bg-secondary/10 text-secondary-foreground bg-transparent"
              >
                No, solo gastos futuros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para compartir grupo */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Share className="h-5 w-5" />
              Compartir Rebaño
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-accent-foreground mb-2">"{group.name}"</div>
              <div className="text-sm text-muted-foreground">Invita amigos a tu rebaño</div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={shareViaWhatsApp}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center gap-3"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#25D366] font-bold text-sm">W</span>
                </div>
                Compartir por WhatsApp
              </Button>

              <Button
                onClick={shareViaTelegram}
                className="w-full h-12 bg-[#0088cc] hover:bg-[#006ba6] text-white flex items-center justify-center gap-3"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#0088cc] font-bold text-sm">T</span>
                </div>
                Compartir por Telegram
              </Button>

              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="w-full h-12 border-primary/30 hover:bg-primary/10 text-primary bg-transparent flex items-center justify-center gap-3"
              >
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">@</span>
                </div>
                Compartir por Email
              </Button>

              <Button
                onClick={copyToClipboardShare}
                variant="outline"
                className="w-full h-12 border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent flex items-center justify-center gap-3"
              >
                <Copy className="h-5 w-5" />
                Copiar enlace
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
              💡 Tip: Tus amigos podrán unirse al rebaño usando cualquiera de estos métodos
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tu Balance - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
            💰 Tu Balance en este Rebaño
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-muted/30 to-secondary/10">
            {userBalance > 0 ? (
              <div className="text-accent-foreground">
                <div className="text-3xl sm:text-4xl font-bold">+${userBalance.toFixed(2)}</div>
                <div className="text-xs sm:text-sm bg-accent/20 px-3 py-1 rounded-full inline-block mt-2">
                  ¡Te deben dinero! 🎉
                </div>
              </div>
            ) : userBalance < 0 ? (
              <div className="text-destructive">
                <div className="text-3xl sm:text-4xl font-bold">${userBalance.toFixed(2)}</div>
                <div className="text-xs sm:text-sm bg-destructive/20 px-3 py-1 rounded-full inline-block mt-2">
                  Debes dinero 💸
                </div>
              </div>
            ) : (
              <div className="text-primary">
                <div className="text-3xl sm:text-4xl font-bold">$0.00</div>
                <div className="text-xs sm:text-sm bg-primary/20 px-3 py-1 rounded-full inline-block mt-2">
                  ¡Estás al día! ✨
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transferencias Pendientes - Responsive */}
      {userSettlements.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl text-destructive flex items-center gap-2">
              💸 Tus Transferencias Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userSettlements.map((settlement, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl cursor-pointer hover:bg-destructive/15 transition-colors border border-destructive/20">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-destructive/20 rounded-full">
                        <CreditCard className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-destructive text-sm sm:text-base truncate">
                          Transferir a {getUserDisplayName(settlement.to, usersData)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Toca para ver detalles</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-base sm:text-lg font-bold text-destructive">
                        ${settlement.amount.toFixed(2)}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-sm sm:max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2 text-lg">
                      💸 Transferir a {getUserDisplayName(settlement.to, usersData)}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-destructive/10 rounded-xl">
                      <div className="text-2xl sm:text-3xl font-bold text-destructive">
                        ${settlement.amount.toFixed(2)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">Monto a transferir</div>
                    </div>

                    {usersData[settlement.to]?.paymentInfo ? (
                      <div className="space-y-3">
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
                          <div className="space-y-2">
                            <div className="font-medium text-accent-foreground text-sm">Información de pago:</div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm sm:text-base font-mono bg-white/50 px-2 py-1 rounded flex-1 break-all">
                                {usersData[settlement.to].paymentInfo}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(usersData[settlement.to].paymentInfo)}
                                className="bg-transparent flex-shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                          💡 Tip: Usa la descripción "Vaquitapp - {group.name}" en tu transferencia
                        </div>

                        <div className="p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                          <div className="text-center space-y-3">
                            <div className="text-sm text-primary font-medium">¿Ya realizaste la transferencia?</div>
                            <Button
                              onClick={() => confirmTransfer(settlement)}
                              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary h-9 sm:h-10 text-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Transferencia
                            </Button>
                            <div className="text-xs text-muted-foreground">Esto actualizará los balances del grupo</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-destructive/10 rounded-xl text-center">
                        <div className="text-destructive font-medium text-sm">⚠️ Sin información de pago</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {getUserDisplayName(settlement.to, usersData)} debe completar su perfil
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transferencias Confirmadas - Responsive */}
      {transfers.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
              ✅ Transferencias Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-primary/20 rounded-full">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {getUserDisplayName(transfer.from, usersData)} → {getUserDisplayName(transfer.to, usersData)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transfer.confirmedAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-primary flex-shrink-0">
                    ${transfer.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liquidación Completa - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
            🔄 Liquidación Completa del Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-3">🎊</div>
              <div className="text-base sm:text-lg font-semibold text-accent-foreground">¡Todo saldado!</div>
              <div className="text-sm text-muted-foreground">El rebaño está en paz</div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl"
                >
                  <span className="font-medium text-primary text-sm sm:text-base flex-1 truncate">
                    {getUserDisplayName(settlement.from, usersData)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-primary text-sm sm:text-base flex-1 truncate">
                    {getUserDisplayName(settlement.to, usersData)}
                  </span>
                  <Badge className="ml-auto bg-accent/20 text-accent-foreground text-xs sm:text-sm flex-shrink-0">
                    ${settlement.amount.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balances Individuales - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
            📊 Balances Individuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {group.members.map((memberId: string) => {
              const balance = balances[memberId] || 0
              return (
                <div key={memberId} className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {usersData[memberId]?.photoURL ? (
                      <Image
                        src={usersData[memberId].photoURL || "/placeholder.svg"}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {getUserDisplayName(memberId, usersData)}
                      </div>
                      {memberId === user?.uid && <div className="text-xs text-muted-foreground">(Tú)</div>}
                    </div>
                  </div>
                  <div
                    className={`text-base sm:text-lg font-bold flex-shrink-0 ${
                      balance > 0 ? "text-accent-foreground" : balance < 0 ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {balance > 0 ? "+" : ""}${balance.toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Gastos - MEJORADO Y RESPONSIVE */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            Historial de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-3">📝</div>
              <div className="text-sm sm:text-base">No hay gastos registrados</div>
              <div className="text-xs sm:text-sm mt-1">¡Agrega el primer gasto!</div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20 active:scale-[0.98]"
                  onClick={() => onNavigate("expense-detail", groupId, expense.id)}
                >
                  {/* Foto de perfil del que pagó */}
                  <div className="flex-shrink-0">
                    {usersData[expense.paidBy]?.photoURL ? (
                      <Image
                        src={usersData[expense.paidBy].photoURL || "/placeholder.svg"}
                        alt={getUserDisplayName(expense.paidBy, usersData)}
                        width={40}
                        height={40}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/20">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Información del gasto */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base text-primary truncate mb-1">
                      {expense.description}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">
                        {expense.createdAt?.toDate().toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {expense.participants?.length || group.members.length}
                      </span>
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-base sm:text-lg font-bold text-primary">${expense.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(expense.amount / (expense.participants?.length || group.members.length)).toFixed(2)} c/u
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CHAT DEL GRUPO - NUEVO */}
      <GroupChat groupId={groupId} groupName={group.name} usersData={usersData} />
    </div>
  )
}
