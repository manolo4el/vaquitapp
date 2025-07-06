"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { toast } from "sonner"
import { FriendsSelector } from "./friends-selector"
import { createNotificationsForGroupMembers } from "@/lib/notifications"

interface AddExpensePageProps {
  groupId?: string
  onBack: () => void
}

interface Friend {
  id: string
  name: string
  email: string
  photoURL?: string
}

interface Group {
  id: string
  name: string
  members: string[]
}

export function AddExpensePage({ groupId, onBack }: AddExpensePageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [usersData, setUsersData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (groupId) {
      loadGroup()
    }
  }, [groupId])

  const loadGroup = async () => {
    if (!groupId) return

    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group
        setGroup(groupData)

        // Cargar datos de usuarios para obtener nombres
        const userPromises = groupData.members.map(async (memberId) => {
          const userDoc = await getDoc(doc(db, "users", memberId))
          return { id: memberId, ...userDoc.data() }
        })
        const users = await Promise.all(userPromises)
        const usersMap = users.reduce(
          (acc, user) => {
            acc[user.id] = user
            return acc
          },
          {} as Record<string, any>,
        )
        setUsersData(usersMap)
      }
    } catch (error) {
      console.error("Error loading group:", error)
      toast.error("Error al cargar el grupo")
    }
  }

  const formatAmount = (value: string) => {
    // Remover caracteres no numéricos excepto punto y coma
    const numericValue = value.replace(/[^\d.,]/g, "")

    // Convertir comas a puntos para el cálculo
    const normalizedValue = numericValue.replace(",", ".")

    // Validar que sea un número válido
    if (normalizedValue && !isNaN(Number.parseFloat(normalizedValue))) {
      const number = Number.parseFloat(normalizedValue)
      // Formatear con separador de miles y decimales
      return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number)
    }

    return numericValue
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatAmount(value)
    setAmount(formatted)
  }

  const parseAmount = (formattedAmount: string): number => {
    // Remover separadores de miles y convertir coma decimal a punto
    const cleanAmount = formattedAmount.replace(/\./g, "").replace(",", ".")
    return Number.parseFloat(cleanAmount) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !amount.trim()) {
      toast.error("Por favor completa todos los campos")
      return
    }

    const numericAmount = parseAmount(amount)
    if (numericAmount <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    setLoading(true)

    try {
      let participantIds: string[] = []
      const expenseGroupId = groupId

      if (groupId) {
        // Si estamos en un grupo, usar todos los miembros del grupo
        participantIds = group?.members || []
      } else {
        // Si no hay grupo, usar los amigos seleccionados + el usuario actual
        participantIds = [user.uid, ...selectedFriends.map((f) => f.id)]
      }

      if (participantIds.length < 2) {
        toast.error("Debe haber al menos 2 participantes")
        setLoading(false)
        return
      }

      const splitAmount = numericAmount / participantIds.length

      const expenseData = {
        title: title.trim(),
        amount: numericAmount,
        paidBy: user.uid,
        participants: participantIds,
        splitAmount,
        createdAt: new Date(),
        groupId: expenseGroupId || null,
      }

      let docRef
      if (expenseGroupId) {
        // Agregar a la subcolección del grupo
        docRef = await addDoc(collection(db, "groups", expenseGroupId, "expenses"), expenseData)
      } else {
        // Agregar a la colección principal de gastos
        docRef = await addDoc(collection(db, "expenses"), expenseData)
      }

      // Crear notificaciones para los miembros del grupo (excepto quien agregó el gasto)
      if (expenseGroupId && group) {
        const userName = usersData[user.uid]?.displayName || usersData[user.uid]?.email || "Alguien"
        const message = `${userName} agregó un gasto de $${formatAmount(numericAmount.toString())} en '${title.trim()}'`

        await createNotificationsForGroupMembers(expenseGroupId, user.uid, "new_expense", message)
      }

      toast.success("Gasto agregado exitosamente")

      // Limpiar formulario
      setTitle("")
      setAmount("")
      setSelectedFriends([])

      // Volver a la pantalla anterior
      onBack()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Error al agregar el gasto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{groupId ? `Agregar gasto - ${group?.name}` : "Agregar gasto"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Descripción</Label>
              <Input
                id="title"
                type="text"
                placeholder="¿En qué gastaste?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            {!groupId && (
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Seleccionar amigos
                </Label>
                <FriendsSelector selectedFriends={selectedFriends} onSelectionChange={setSelectedFriends} />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
