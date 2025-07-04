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

    const amount = Number.parseFloat(expenseAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido",
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

      trackExpenseAction("expense_added", amount, groupId, {
        description: expenseTitle,
        participant_count: participants.length,
        paid_by_self: paidBy === user?.uid,
      })

      toast({
        title: "¡Éxito!",
        description: "¡Gasto agregado exitosamente! 🐄",
      })

      if (addAnother) {
        // Limpiar formulario para agregar otro
        setExpenseTitle("")
        setExpenseAmount("")
        setPaidBy(user?.uid || "")
        setParticipants(group?.members || [])
      } else {
        // Volver al grupo
        onNavigate("group-details", groupId)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("group-details", groupId)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Agregar Gasto</h1>
          <p className="text-sm text-muted-foreground">{group.name}</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">💰 Nuevo Gasto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descripción del gasto */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-primary">
              ¿En qué gastaron?
            </Label>
            <Input
              id="title"
              placeholder="Ej: Cena, Uber, Supermercado..."
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="h-12 border-primary/20 focus:border-primary"
            />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-primary">
              ¿Cuánto gastaron?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="h-12 pl-8 border-primary/20 focus:border-primary"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Quién pagó */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-primary">¿Quién pagó?</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-12 border-primary/20 focus:border-primary">
                <SelectValue placeholder="Seleccionar quien pagó" />
              </SelectTrigger>
              <SelectContent>
                {group.members.map((memberId: string) => (
                  <SelectItem key={memberId} value={memberId}>
                    <div className="flex items-center gap-2">
                      {usersData[memberId]?.photoURL && (
                        <img
                          src={usersData[memberId].photoURL || "/placeholder.svg"}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>
                        {usersData[memberId]?.displayName || "Usuario"}
                        {memberId === user?.uid && " (Vos)"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participantes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-primary">¿Quiénes participan del gasto?</Label>
            <div className="space-y-3">
              {group.members.map((memberId: string) => (
                <div key={memberId} className="flex items-center space-x-3">
                  <Checkbox
                    id={memberId}
                    checked={participants.includes(memberId)}
                    onCheckedChange={() => handleParticipantToggle(memberId)}
                  />
                  <label htmlFor={memberId} className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                    {usersData[memberId]?.photoURL && (
                      <img
                        src={usersData[memberId].photoURL || "/placeholder.svg"}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>
                      {usersData[memberId]?.displayName || "Usuario"}
                      {memberId === user?.uid && " (Vos)"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            {participants.length > 0 && (
              <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                💡 El gasto se dividirá entre {participants.length} persona{participants.length !== 1 ? "s" : ""} ($
                {(Number.parseFloat(expenseAmount) / participants.length || 0).toFixed(2)} cada uno)
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => addExpense(false)}
              disabled={loading || !expenseTitle.trim() || !expenseAmount || participants.length === 0}
              className="h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Agregar Gasto
            </Button>

            <Button
              onClick={() => addExpense(true)}
              disabled={loading || !expenseTitle.trim() || !expenseAmount || participants.length === 0}
              variant="outline"
              className="h-12 border-primary/20 hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar y Crear Otro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
