"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { ArrowLeft, Plus, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAnalytics } from "@/hooks/use-analytics"
import { parseInputNumber, formatAmount } from "@/lib/calculations"

interface AddExpensePageProps {
  groupId: string
  onNavigate: (page: string, groupId?: string) => void
}

export function AddExpensePage({ groupId, onNavigate }: AddExpensePageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>({})
  const [expenseTitle, setExpenseTitle] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [paidBy, setPaidBy] = useState(user?.uid || "")
  const [participants, setParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { trackExpenseAction } = useAnalytics()

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return

      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() }
        setGroup(groupData)
        setParticipants(groupData.members) // Por defecto, todos participan

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
    }

    loadGroupData()
  }, [groupId])

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addExpense = async (addAnother = false) => {
    if (!expenseTitle.trim() || !expenseAmount || participants.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const amount = parseInputNumber(expenseAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "groups", groupId, "expenses"), {
        description: expenseTitle,
        amount,
        paidBy,
        participants,
        createdAt: new Date(),
      })

      trackExpenseAction("expense_added", amount, groupId)

      toast({
        title: "¡Éxito!",
        description: "¡Gasto agregado exitosamente! 🐄",
      })

      if (addAnother) {
        // Limpiar formulario para agregar otro
        setExpenseTitle("")
        setExpenseAmount("")
        setParticipants(group?.members || [])
      } else {
        // Volver al grupo en lugar del dashboard
        onNavigate("group-details", groupId)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al agregar el gasto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calcular el monto por persona para mostrar
  const amountPerPerson = participants.length > 0 ? parseInputNumber(expenseAmount) / participants.length : 0

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("group-details", groupId)}
          className="border-primary/20 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Agregar Gasto 💸</h1>
          <p className="text-muted-foreground">Rebaño: {group.name}</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">📝 Detalles del Gasto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Título del gasto */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-primary font-medium">
              ¿En qué gastaste?
            </Label>
            <Input
              id="title"
              placeholder="Ej: Cena en el restaurante, Uber, Supermercado..."
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="border-primary/20 focus:border-primary h-12"
            />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-primary font-medium">
              ¿Cuánto gastaste?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="border-primary/20 focus:border-primary h-12 pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Podés usar punto (.) o coma (,) para los decimales. Ej: 1500,50 o 1.500,50
            </p>
          </div>

          {/* Quién pagó */}
          <div className="space-y-2">
            <Label className="text-primary font-medium">¿Quién pagó?</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="border-primary/20 focus:border-primary h-12">
                <SelectValue placeholder="Selecciona quién pagó" />
              </SelectTrigger>
              <SelectContent>
                {group.members.map((memberId: string) => (
                  <SelectItem key={memberId} value={memberId}>
                    {usersData[memberId]?.displayName || usersData[memberId]?.email || "Usuario"}
                    {memberId === user?.uid && " (Tú)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participantes */}
          <div className="space-y-3">
            <Label className="text-primary font-medium">¿Quiénes participan en este gasto?</Label>
            <div className="space-y-3">
              {group.members.map((memberId: string) => (
                <div key={memberId} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Checkbox
                    id={memberId}
                    checked={participants.includes(memberId)}
                    onCheckedChange={() => handleParticipantToggle(memberId)}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {usersData[memberId]?.photoURL && (
                      <img
                        src={usersData[memberId].photoURL || "/placeholder.svg"}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <Label htmlFor={memberId} className="cursor-pointer">
                      {usersData[memberId]?.displayName || usersData[memberId]?.email || "Usuario"}
                      {memberId === user?.uid && " (Tú)"}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
              <div className="text-sm text-accent-foreground">
                <div className="font-medium mb-1">📊 División del gasto:</div>
                <div className="text-xs text-muted-foreground">
                  {participants.length > 0 ? (
                    <>
                      El gasto se dividirá entre {participants.length} persona{participants.length !== 1 ? "s" : ""}
                      {amountPerPerson > 0 && (
                        <span className="block mt-1 font-medium text-accent-foreground">
                          ${formatAmount(amountPerPerson)} cada uno
                        </span>
                      )}
                    </>
                  ) : (
                    "Selecciona al menos un participante"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => addExpense(false)}
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Check className="h-4 w-4 mr-2" />
              {loading ? "Agregando..." : "Agregar y Volver"}
            </Button>
            <Button
              onClick={() => addExpense(true)}
              disabled={loading}
              variant="outline"
              className="flex-1 h-12 border-accent/30 hover:bg-accent/10 text-accent-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar y Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
