"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AddExpensePageProps {
  onBack: () => void
  groups: any[]
}

export function AddExpensePage({ onBack, groups }: AddExpensePageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    groupId: "",
    category: "general",
    splitType: "equal" as "equal" | "custom",
    participants: [] as string[],
    customSplits: {} as Record<string, number>,
  })

  const categories = [
    { value: "food", label: "🍕 Comida", color: "bg-orange-100 text-orange-800" },
    { value: "transport", label: "🚗 Transporte", color: "bg-blue-100 text-blue-800" },
    { value: "entertainment", label: "🎬 Entretenimiento", color: "bg-purple-100 text-purple-800" },
    { value: "shopping", label: "🛍️ Compras", color: "bg-pink-100 text-pink-800" },
    { value: "utilities", label: "⚡ Servicios", color: "bg-yellow-100 text-yellow-800" },
    { value: "health", label: "🏥 Salud", color: "bg-red-100 text-red-800" },
    { value: "general", label: "📝 General", color: "bg-gray-100 text-gray-800" },
  ]

  const selectedGroup = groups.find((g) => g.id === formData.groupId)
  const groupMembers = selectedGroup?.members || []

  const handleParticipantToggle = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter((id) => id !== memberId)
        : [...prev.participants, memberId],
    }))
  }

  const handleCustomSplitChange = (memberId: string, amount: number) => {
    setFormData((prev) => ({
      ...prev,
      customSplits: {
        ...prev.customSplits,
        [memberId]: amount,
      },
    }))
  }

  const calculateSplits = () => {
    const amount = Number.parseFloat(formData.amount)
    if (!amount || formData.participants.length === 0) return {}

    if (formData.splitType === "equal") {
      const splitAmount = amount / formData.participants.length
      return formData.participants.reduce(
        (acc, id) => ({
          ...acc,
          [id]: splitAmount,
        }),
        {},
      )
    }

    return formData.customSplits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.groupId || !formData.title || !formData.amount) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (formData.participants.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un participante",
        variant: "destructive",
      })
      return
    }

    const splits = calculateSplits()
    const totalSplit = Object.values(splits).reduce((sum, amount) => sum + amount, 0)
    const expenseAmount = Number.parseFloat(formData.amount)

    if (Math.abs(totalSplit - expenseAmount) > 0.01) {
      toast({
        title: "Error",
        description: "La suma de las divisiones no coincide con el monto total",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "expenses"), {
        title: formData.title,
        amount: expenseAmount,
        description: formData.description,
        category: formData.category,
        groupId: formData.groupId,
        paidBy: user.uid,
        participants: formData.participants,
        splits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "¡Gasto agregado!",
        description: "El gasto se ha registrado correctamente",
      })

      onBack()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Gasto</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Información del Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Cena en el restaurante"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalles adicionales del gasto..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="group">Grupo *</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, groupId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedGroup && (
            <Card>
              <CardHeader>
                <CardTitle>División del Gasto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.splitType === "equal" ? "default" : "outline"}
                    onClick={() => setFormData((prev) => ({ ...prev, splitType: "equal" }))}
                  >
                    División Igual
                  </Button>
                  <Button
                    type="button"
                    variant={formData.splitType === "custom" ? "default" : "outline"}
                    onClick={() => setFormData((prev) => ({ ...prev, splitType: "custom" }))}
                  >
                    División Personalizada
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Participantes *</Label>
                  {groupMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={formData.participants.includes(member.id)}
                          onCheckedChange={() => handleParticipantToggle(member.id)}
                        />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      {formData.splitType === "custom" && formData.participants.includes(member.id) && (
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          placeholder="0.00"
                          value={formData.customSplits[member.id] || ""}
                          onChange={(e) => handleCustomSplitChange(member.id, Number.parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {formData.amount && formData.participants.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">Resumen de División:</h4>
                    {Object.entries(calculateSplits()).map(([memberId, amount]) => {
                      const member = groupMembers.find((m: any) => m.id === memberId)
                      return (
                        <div key={memberId} className="flex justify-between text-sm">
                          <span>{member?.name}</span>
                          <span>${amount.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando..." : "Agregar Gasto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
