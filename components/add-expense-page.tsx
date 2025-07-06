"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { toast } from "sonner"
import { FriendsSelector } from "./friends-selector"
import { createNotificationsForGroupMembers } from "@/lib/notifications"

interface AddExpensePageProps {
  groupId: string
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
  createdBy: string
  createdAt: Date
}

export function AddExpensePage({ groupId, onBack }: AddExpensePageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [expenseTitle, setExpenseTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal")
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = groupDoc.data()
        setGroup({
          id: groupDoc.id,
          name: groupData.name,
          members: groupData.members || [],
          createdBy: groupData.createdBy,
          createdAt: groupData.createdAt?.toDate() || new Date(),
        })
        // Por defecto, incluir al usuario actual
        if (user) {
          setSelectedFriends([user.uid])
        }
      }
    } catch (error) {
      console.error("Error loading group:", error)
      toast.error("Error al cargar el grupo")
    }
  }

  const formatAmount = (value: string) => {
    // Remover caracteres no numéricos excepto punto y coma
    const cleanValue = value.replace(/[^\d.,]/g, "")

    // Convertir coma a punto para el cálculo
    const numericValue = Number.parseFloat(cleanValue.replace(",", "."))

    if (isNaN(numericValue)) return ""

    // Formatear con separadores de miles argentinos
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  }

  const handleAmountChange = (value: string) => {
    const formatted = formatAmount(value)
    setAmount(formatted)
  }

  const handleCustomAmountChange = (friendId: string, value: string) => {
    const formatted = formatAmount(value)
    setCustomAmounts((prev) => ({
      ...prev,
      [friendId]: formatted,
    }))
  }

  const parseAmount = (formattedAmount: string): number => {
    // Remover separadores de miles y convertir coma a punto
    const cleanAmount = formattedAmount.replace(/\./g, "").replace(",", ".")
    return Number.parseFloat(cleanAmount) || 0
  }

  const calculateSplit = () => {
    const totalAmount = parseAmount(amount)

    if (splitType === "equal") {
      const perPerson = totalAmount / selectedFriends.length
      const split: { [key: string]: number } = {}
      selectedFriends.forEach((friendId) => {
        split[friendId] = perPerson
      })
      return split
    } else {
      const split: { [key: string]: number } = {}
      selectedFriends.forEach((friendId) => {
        split[friendId] = parseAmount(customAmounts[friendId] || "0")
      })
      return split
    }
  }

  const validateCustomSplit = () => {
    const totalAmount = parseAmount(amount)
    const customTotal = selectedFriends.reduce((sum, friendId) => {
      return sum + parseAmount(customAmounts[friendId] || "0")
    }, 0)

    return Math.abs(totalAmount - customTotal) < 0.01 // Permitir pequeñas diferencias por redondeo
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !group) return

    if (!expenseTitle.trim() || !amount || selectedFriends.length === 0) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    if (splitType === "custom" && !validateCustomSplit()) {
      toast.error("La suma de los montos personalizados debe ser igual al total")
      return
    }

    setLoading(true)

    try {
      const split = calculateSplit()
      const totalAmount = parseAmount(amount)

      // Crear el gasto
      const expenseData = {
        title: expenseTitle.trim(),
        amount: totalAmount,
        description: description.trim(),
        paidBy: user.uid,
        splitBetween: selectedFriends,
        split,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await addDoc(collection(db, "groups", groupId, "expenses"), expenseData)

      // Actualizar la última actividad del grupo
      await updateDoc(doc(db, "groups", groupId), {
        lastActivity: new Date(),
        recentExpenses: arrayUnion({
          title: expenseTitle.trim(),
          amount: totalAmount,
          paidBy: user.uid,
          createdAt: new Date(),
        }),
      })

      // Crear notificaciones para los miembros del grupo
      const message = `${user.displayName || user.email || "Alguien"} agregó un gasto de $${formatAmount(amount)} en '${expenseTitle.trim()}'`
      await createNotificationsForGroupMembers(groupId, user.uid, "new_expense", message)

      toast.success("Gasto agregado exitosamente")
      onBack()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Error al agregar el gasto")
    } finally {
      setLoading(false)
    }
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  const totalCustomAmount = selectedFriends.reduce((sum, friendId) => {
    return sum + parseAmount(customAmounts[friendId] || "0")
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">Agregar Gasto</h1>
              <p className="text-sm text-muted-foreground">{group.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Detalles del Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del gasto *</Label>
                <Input
                  id="title"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ej: Cena en el restaurante"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto total *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0,00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales del gasto..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                División del Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FriendsSelector
                groupId={groupId}
                selectedFriends={selectedFriends}
                onSelectionChange={setSelectedFriends}
                currentUserId={user?.uid || ""}
              />

              {selectedFriends.length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={splitType === "equal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitType("equal")}
                    >
                      División Igual
                    </Button>
                    <Button
                      type="button"
                      variant={splitType === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitType("custom")}
                    >
                      Montos Personalizados
                    </Button>
                  </div>

                  {splitType === "equal" && amount && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">División igual:</p>
                      <p className="font-medium">
                        ${formatAmount((parseAmount(amount) / selectedFriends.length).toString())} por persona
                      </p>
                    </div>
                  )}

                  {splitType === "custom" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Asigna montos específicos a cada persona:</p>
                      {selectedFriends.map((friendId) => (
                        <div key={friendId} className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-sm">
                              {friendId === user?.uid ? "Tú" : `Usuario ${friendId.slice(0, 8)}`}
                            </Label>
                          </div>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                              $
                            </span>
                            <Input
                              value={customAmounts[friendId] || ""}
                              onChange={(e) => handleCustomAmountChange(friendId, e.target.value)}
                              placeholder="0,00"
                              className="pl-8 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total asignado:</span>
                          <span className={totalCustomAmount !== parseAmount(amount) ? "text-destructive" : ""}>
                            ${formatAmount(totalCustomAmount.toString())}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total del gasto:</span>
                          <span>${amount}</span>
                        </div>
                        {totalCustomAmount !== parseAmount(amount) && (
                          <p className="text-xs text-destructive mt-1">Los montos deben sumar exactamente el total</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando..." : "Guardar Gasto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
