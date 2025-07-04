"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { getUserDisplayName, formatAmount } from "@/lib/calculations"
import { ArrowLeft, Receipt, Users, Calendar, Trash2, Edit, DollarSign, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface ExpenseDetailPageProps {
  groupId: string
  expenseId: string
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

export function ExpenseDetailPage({ groupId, expenseId, onNavigate }: ExpenseDetailPageProps) {
  const { user } = useAuth()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [group, setGroup] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadExpenseData = async () => {
      if (!groupId || !expenseId) return

      try {
        // Cargar el gasto
        const expenseDoc = await getDoc(doc(db, "groups", groupId, "expenses", expenseId))
        if (expenseDoc.exists()) {
          const expenseData = { id: expenseDoc.id, ...expenseDoc.data() } as Expense
          setExpense(expenseData)
        }

        // Cargar el grupo
        const groupDoc = await getDoc(doc(db, "groups", groupId))
        if (groupDoc.exists()) {
          const groupData = { id: groupDoc.id, ...groupDoc.data() }
          setGroup(groupData)

          // Cargar datos de usuarios
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
      } catch (error) {
        console.error("Error loading expense data:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del gasto",
          variant: "destructive",
        })
      }
    }

    loadExpenseData()
  }, [groupId, expenseId])

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  const handleDeleteExpense = async () => {
    if (!expense || !user) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "groups", groupId, "expenses", expenseId))
      toast({
        title: "¡Gasto eliminado! 🗑️",
        description: "El gasto se eliminó correctamente",
      })
      onNavigate("group-details", groupId)
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (!expense || !group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const participants = expense.participants || group.members
  const amountPerPerson = expense.amount / participants.length
  const canEdit = expense.paidBy === user?.uid

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header - Responsive */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("group-details", groupId)}
          className="border-primary/20 hover:bg-primary/10 h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 truncate">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">Detalle del Gasto</span>
          </h1>
          <p className="text-sm text-muted-foreground truncate">{group.name}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate("edit-expense", groupId, expenseId)}
              className="border-primary/20 hover:bg-primary/10 h-9 w-9 sm:h-10 sm:w-10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-destructive/20 hover:bg-destructive/10 text-destructive h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm sm:max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Eliminar Gasto
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                    <div className="text-center space-y-2">
                      <div className="text-destructive font-medium">¿Estás seguro?</div>
                      <div className="text-sm text-muted-foreground">
                        Esta acción no se puede deshacer. El gasto "{expense.description}" será eliminado
                        permanentemente.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleDeleteExpense}
                      disabled={isDeleting}
                      className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sí, eliminar gasto
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(false)}
                      variant="outline"
                      className="w-full"
                      disabled={isDeleting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Información Principal del Gasto - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
            {expense.description}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Monto total */}
          <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-muted/30 to-primary/10">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">${formatAmount(expense.amount)}</div>
            <div className="text-sm text-muted-foreground">Monto total del gasto</div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
              <div className="p-2 bg-primary/20 rounded-full">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Pagado por</div>
                <div className="font-medium text-sm sm:text-base truncate">
                  {getUserDisplayName(expense.paidBy, usersData)}
                  {expense.paidBy === user?.uid && " (Tú)"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
              <div className="p-2 bg-accent/20 rounded-full">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Fecha</div>
                <div className="font-medium text-sm sm:text-base">
                  {expense.createdAt?.toDate().toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* División del Gasto - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-accent-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            División del Gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Monto por persona */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
              <div className="text-xl sm:text-2xl font-bold text-accent-foreground">
                ${formatAmount(amountPerPerson)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">por persona</div>
            </div>

            {/* Lista de participantes */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({participants.length})
              </div>
              <div className="space-y-2">
                {participants.map((participantId: string) => (
                  <div
                    key={participantId}
                    className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {usersData[participantId]?.photoURL ? (
                        <Image
                          src={usersData[participantId].photoURL || "/placeholder.svg"}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {getUserDisplayName(participantId, usersData)}
                        </div>
                        {participantId === user?.uid && <div className="text-xs text-muted-foreground">(Tú)</div>}
                        {participantId === expense.paidBy && (
                          <Badge className="text-xs bg-primary/20 text-primary">Pagó</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-primary flex-shrink-0">
                      ${formatAmount(amountPerPerson)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Deuda - Responsive */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">💰 Resumen de Deuda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants
              .filter((participantId: string) => participantId !== expense.paidBy)
              .map((participantId: string) => (
                <div
                  key={participantId}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border border-destructive/20"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {usersData[participantId]?.photoURL ? (
                      <Image
                        src={usersData[participantId].photoURL || "/placeholder.svg"}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 sm:h-8 sm:w-8 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-destructive truncate">
                        {getUserDisplayName(participantId, usersData)}
                        {participantId === user?.uid && " (Tú)"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        debe a {getUserDisplayName(expense.paidBy, usersData)}
                      </div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-destructive flex-shrink-0">
                    ${formatAmount(amountPerPerson)}
                  </div>
                </div>
              ))}

            {participants.filter((participantId: string) => participantId !== expense.paidBy).length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <div className="text-3xl sm:text-4xl mb-3">🎉</div>
                <div className="text-base sm:text-lg font-semibold text-primary">¡Solo tú participaste!</div>
                <div className="text-sm text-muted-foreground">No hay deudas que saldar</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
