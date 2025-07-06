"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, DollarSign, Users, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatCurrency } from "@/lib/calculations"

interface AddExpensePageProps {
  groupId?: string
  onNavigate: (page: string, data?: any) => void
}

interface GroupMember {
  id: string
  name: string
  email: string
  photoURL?: string
}

interface Group {
  id: string
  name: string
  members: string[]
  memberDetails: GroupMember[]
}

export function AddExpensePage({ groupId, onNavigate }: AddExpensePageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [category, setCategory] = useState("general")

  useEffect(() => {
    if (groupId && user) {
      loadGroup()
    }
  }, [groupId, user])

  const loadGroup = async () => {
    if (!groupId) return

    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = groupDoc.data()

        // Load member details
        const memberDetails: GroupMember[] = []
        for (const memberId of groupData.members) {
          const memberDoc = await getDoc(doc(db, "users", memberId))
          if (memberDoc.exists()) {
            const memberData = memberDoc.data()
            memberDetails.push({
              id: memberId,
              name: memberData.name || memberData.email,
              email: memberData.email,
              photoURL: memberData.photoURL,
            })
          }
        }

        setGroup({
          id: groupDoc.id,
          name: groupData.name,
          members: groupData.members,
          memberDetails,
        })

        // Pre-select current user
        setSelectedParticipants([user.uid])
      }
    } catch (error) {
      console.error("Error loading group:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el grupo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !group || !description.trim() || !amount || selectedParticipants.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const numericAmount = Number.parseFloat(amount.replace(",", "."))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      // Create expense
      const expenseData = {
        description: description.trim(),
        amount: numericAmount,
        paidBy: user.uid,
        paidByName: user.displayName || user.email,
        participants: selectedParticipants,
        groupId: group.id,
        groupName: group.name,
        category,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
      }

      const expenseRef = await addDoc(collection(db, "expenses"), expenseData)

      // Update group with new expense
      await updateDoc(doc(db, "groups", group.id), {
        expenses: arrayUnion(expenseRef.id),
        lastActivity: Timestamp.now(),
      })

      // Create notifications for other participants
      const participantNames = group.memberDetails
        .filter((member) => selectedParticipants.includes(member.id) && member.id !== user.uid)
        .map((member) => member.name)

      for (const participantId of selectedParticipants) {
        if (participantId !== user.uid) {
          await createNotification(
            participantId,
            "expense_added",
            "Nuevo gasto agregado",
            `${user.displayName || user.email} agregó "${description}" por ${formatCurrency(numericAmount)}`,
            group.id,
            group.name,
            user.uid,
            user.displayName || user.email,
          )
        }
      }

      toast({
        title: "¡Éxito!",
        description: "Gasto agregado correctamente",
      })

      // Navigate back to group details
      onNavigate("group-details", { groupId: group.id })
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit(e)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Grupo no encontrado</p>
          <Button onClick={() => onNavigate("groups")}>Volver a grupos</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("group-details", { groupId: group.id })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-primary">Agregar Gasto</h1>
          <p className="text-sm text-muted-foreground">{group.name}</p>
        </div>
      </div>

      <form onSubmit={handleSaveAndReturn} className="space-y-6">
        {/* Expense Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Detalles del Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="¿En qué gastaron?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={saving}
              >
                <option value="general">General</option>
                <option value="food">Comida</option>
                <option value="transport">Transporte</option>
                <option value="entertainment">Entretenimiento</option>
                <option value="shopping">Compras</option>
                <option value="utilities">Servicios</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Participantes ({selectedParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.memberDetails.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedParticipants.includes(member.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleParticipant(member.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.photoURL || "/placeholder.svg"} />
                      <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {selectedParticipants.includes(member.id) && (
                    <Badge variant="default" className="bg-primary">
                      Incluido
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedParticipants.length > 0 && amount && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Cada persona pagará:</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(Number.parseFloat(amount.replace(",", ".")) / selectedParticipants.length)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => onNavigate("group-details", { groupId: group.id })}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving || !description.trim() || !amount || selectedParticipants.length === 0}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
