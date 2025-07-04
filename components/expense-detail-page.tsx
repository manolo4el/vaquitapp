"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { ArrowLeft, Edit, Users, Calendar, DollarSign, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface ExpenseDetailPageProps {
  groupId: string
  expenseId: string
  onNavigate: (page: string, groupId?: string) => void
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
  createdAt: any
  category?: string
}

interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
}

export function ExpenseDetailPage({ groupId, expenseId, onNavigate }: ExpenseDetailPageProps) {
  const { user } = useAuth()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [usersData, setUsersData] = useState<{ [key: string]: User }>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    participants: [] as string[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId || !expenseId) return

    // Cargar datos del gasto
    const loadExpense = async () => {
      try {
        const expenseDoc = await getDoc(doc(db, "groups", groupId, "expenses", expenseId))
        if (expenseDoc.exists()) {
          const expenseData = { id: expenseDoc.id, ...expenseDoc.data() } as Expense
          setExpense(expenseData)
          setEditForm({
            description: expenseData.description,
            amount: expenseData.amount.toString(),
            participants: expenseData.participants || [],
          })
        }
      } catch (error) {
        console.error("Error loading expense:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el gasto",
          variant: "destructive",
        })
      }
    }

    // Cargar miembros del grupo
    const loadGroupMembers = async () => {
      try {
        const groupDoc = await getDoc(doc(db, "groups", groupId))
        if (groupDoc.exists()) {
          const groupData = groupDoc.data()
          const memberPromises = groupData.members.map((uid: string) => getDoc(doc(db, "users", uid)))
          const memberDocs = await Promise.all(memberPromises)

          const members: User[] = []
          const userData: { [key: string]: User } = {}

          memberDocs.forEach((memberDoc) => {
            if (memberDoc.exists()) {
              const member = { uid: memberDoc.id, ...memberDoc.data() } as User
              members.push(member)
              userData[member.uid] = member
            }
          })

          setGroupMembers(members)
          setUsersData(userData)
        }
      } catch (error) {
        console.error("Error loading group members:", error)
      }
    }

    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadExpense(), loadGroupMembers()])
      setLoading(false)
    }

    loadData()
  }, [groupId, expenseId])

  const handleSaveEdit = async () => {
    if (!expense || !editForm.description.trim() || !editForm.amount.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(editForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (editForm.participants.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un participante",
        variant: "destructive",
      })
      return
    }

    try {
      await updateDoc(doc(db, "groups", groupId, "expenses", expenseId), {
        description: editForm.description.trim(),
        amount: amount,
        participants: editForm.participants,
        updatedAt: new Date(),
      })

      setExpense({
        ...expense,
        description: editForm.description.trim(),
        amount: amount,
        participants: editForm.participants,
      })

      setIsEditing(false)
      toast({
        title: "¡Gasto actualizado! ✅",
        description: "Los cambios se guardaron correctamente",
      })
    } catch (error) {
      console.error("Error updating expense:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async () => {
    if (!expense) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "groups", groupId, "expenses", expenseId))

      toast({
        title: "¡Gasto eliminado! 🗑️",
        description: "El gasto se eliminó correctamente",
      })

      // Navegar de vuelta al grupo
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
      setShowDeleteConfirm(false)
    }
  }

  const toggleParticipant = (userId: string) => {
    setEditForm((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }))
  }

  const getUserDisplayName = (uid: string) => {
    return usersData[uid]?.displayName || usersData[uid]?.email || "Usuario desconocido"
  }

  const getUserPhotoURL = (uid: string) => {
    return usersData[uid]?.photoURL || "/placeholder.svg?height=40&width=40"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando gasto...</p>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se encontró el gasto</p>
          <Button onClick={() => onNavigate("group-details", groupId)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al grupo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* Header responsive */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("group-details", groupId)}
          className="flex-shrink-0 px-2 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Volver</span>
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">Detalle del gasto</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="px-2 sm:px-4 text-xs sm:text-sm"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Editar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 sm:px-4 text-xs sm:text-sm text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Eliminar</span>
          </Button>
        </div>
      </div>

      {/* Información del gasto */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {expense.description}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monto */}
          <div className="text-center p-6 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
            <div className="text-sm text-muted-foreground mb-2">Monto total</div>
            <div className="text-4xl font-bold text-accent-foreground">${expense.amount.toFixed(2)}</div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
              <div className="p-2 bg-primary/20 rounded-full">
                <Image
                  src={getUserPhotoURL(expense.paidBy) || "/placeholder.svg"}
                  alt="Pagado por"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pagado por</div>
                <div className="font-medium text-primary">{getUserDisplayName(expense.paidBy)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/5 rounded-xl">
              <div className="p-2 bg-secondary/20 rounded-full">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha</div>
                <div className="font-medium text-secondary-foreground">
                  {expense.createdAt?.toDate().toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">Participantes ({expense.participants.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {expense.participants.map((participantId) => (
                <div key={participantId} className="flex items-center gap-3 p-3 bg-card rounded-xl border">
                  <Image
                    src={getUserPhotoURL(participantId) || "/placeholder.svg"}
                    alt={getUserDisplayName(participantId)}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-primary/20"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-primary">{getUserDisplayName(participantId)}</div>
                    <div className="text-sm text-muted-foreground">
                      Debe: ${(expense.amount / expense.participants.length).toFixed(2)}
                    </div>
                  </div>
                  {participantId === expense.paidBy && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                      Pagó
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Gasto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Ej: Cena en el restaurante"
              />
            </div>

            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Participantes</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupMembers.map((member) => (
                  <div key={member.uid} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={member.uid}
                      checked={editForm.participants.includes(member.uid)}
                      onCheckedChange={() => toggleParticipant(member.uid)}
                    />
                    <Image
                      src={member.photoURL || "/placeholder.svg?height=32&width=32"}
                      alt={member.displayName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <Label htmlFor={member.uid} className="flex-1 cursor-pointer">
                      {member.displayName || member.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Eliminar Gasto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-xl">
              <div className="font-medium text-destructive mb-2">¿Estás seguro que querés eliminar este gasto?</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <strong>Descripción:</strong> {expense.description}
                </div>
                <div>
                  <strong>Monto:</strong> ${expense.amount.toFixed(2)}
                </div>
                <div>
                  <strong>Participantes:</strong> {expense.participants.length}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-3 p-2 bg-background/50 rounded">
                ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los datos del gasto y se recalcularán los
                balances del grupo.
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button onClick={handleDeleteExpense} variant="destructive" className="flex-1" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
