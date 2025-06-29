"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, DollarSign, Users, Receipt, AlertCircle, Check, Search, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { getGroupById, addExpenseToGroup } from "@/lib/group-storage"
import type { Member } from "@/lib/expense-calculator"

interface FormData {
  title: string
  amount: string
  paidBy: string
  participants: string[] // Cambiar de number[] a string[]
  comment: string
}

interface FormErrors {
  title?: string
  amount?: string
  paidBy?: string
  participants?: string
}

export default function AddExpensePage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<{ id: string; name: string; members: Member[] } | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    amount: "",
    paidBy: "",
    participants: [],
    comment: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Cargar datos del grupo
    const groupData = getGroupById(params.id)
    if (groupData) {
      setGroup({
        id: groupData.id,
        name: groupData.name,
        members: groupData.members,
      })
    }
  }, [params.id])

  const handleBack = () => {
    window.location.href = `/group/${params.id}`
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "El título es obligatorio"
    }

    const amount = Number.parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0"
    }

    if (!formData.paidBy) {
      newErrors.paidBy = "Debes seleccionar quién pagó"
    }

    if (formData.participants.length === 0) {
      newErrors.participants = "Debes seleccionar al menos un participante"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearForm = () => {
    setFormData({
      title: "",
      amount: "",
      paidBy: "",
      participants: [],
      comment: "",
    })
    setSearchTerm("")
    setErrors({})
  }

  const saveExpense = async (): Promise<boolean> => {
    if (!validateForm() || !group) {
      return false
    }

    setIsLoading(true)

    try {
      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Encontrar el usuario que pagó
      const paidByUser = group.members.find((m) => m.id === formData.paidBy)
      if (!paidByUser) {
        throw new Error("Usuario que pagó no encontrado")
      }

      // Crear el gasto
      const newExpense = {
        title: formData.title.trim(),
        amount: Number.parseFloat(formData.amount),
        paidBy: { id: paidByUser.id, name: paidByUser.name },
        splitBetween: formData.participants, // Ya son strings
        date: new Date().toISOString(),
        description: formData.comment.trim() || undefined,
      }

      // Agregar al grupo
      addExpenseToGroup(group.id, newExpense)

      console.log("Gasto agregado:", newExpense)
      return true
    } catch (error) {
      console.error("Error al guardar gasto:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAnother = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await saveExpense()
    if (success) {
      // Mostrar mensaje de éxito
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)

      // Limpiar formulario para agregar otro
      clearForm()
    }
  }

  const handleSaveAndReturn = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await saveExpense()
    if (success) {
      // Volver a la pantalla del grupo
      window.location.href = `/group/${params.id}`
    }
  }

  const handleParticipantToggle = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter((id) => id !== memberId)
        : [...prev.participants, memberId],
    }))
  }

  const selectAllParticipants = () => {
    if (!group) return
    setFormData((prev) => ({
      ...prev,
      participants: group.members.map((m) => m.id),
    }))
  }

  const clearAllParticipants = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [],
    }))
  }

  const filteredMembers =
    group?.members.filter((member) => member.name.toLowerCase().includes(searchTerm.toLowerCase())) || []

  const formatAmount = (amount: string) => {
    if (!amount || formData.participants.length === 0) return ""
    const total = Number.parseFloat(amount)
    if (isNaN(total)) return ""
    return `$${(total / formData.participants.length).toFixed(2)} por persona`
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Agregar Gasto</h1>
              <p className="text-sm text-gray-500">{group.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-800 font-medium">¡Gasto agregado exitosamente!</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-coral-500" />
              <span>Nuevo Gasto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Título del gasto */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Título del gasto *
                </Label>
                <Input
                  id="title"
                  placeholder="ej: Pizza, Cerveza, Combustible..."
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Monto total *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className={`pl-10 ${errors.amount ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                </div>
                {formData.amount && formData.participants.length > 0 && (
                  <p className="text-sm text-gray-600">{formatAmount(formData.amount)}</p>
                )}
                {errors.amount && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Quién pagó */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Quién pagó *</Label>
                <Select
                  value={formData.paidBy}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paidBy: value }))}
                >
                  <SelectTrigger className={errors.paidBy ? "border-red-500 focus:border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona quién pagó" />
                  </SelectTrigger>
                  <SelectContent>
                    {group.members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white text-xs">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paidBy && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.paidBy}</span>
                  </p>
                )}
              </div>

              {/* Participantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Participantes *</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllParticipants}
                      className="text-xs bg-transparent"
                    >
                      Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllParticipants}
                      className="text-xs bg-transparent"
                    >
                      Ninguno
                    </Button>
                  </div>
                </div>

                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar miembros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Lista de miembros */}
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={formData.participants.includes(member.id)}
                        onCheckedChange={() => handleParticipantToggle(member.id)}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white text-xs">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <Label htmlFor={`member-${member.id}`} className="flex-1 cursor-pointer font-medium">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>

                {formData.participants.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <Users className="w-4 h-4 inline mr-1" />
                    {formData.participants.length} participante{formData.participants.length > 1 ? "s" : ""}{" "}
                    seleccionado
                    {formData.participants.length > 1 ? "s" : ""}
                  </p>
                )}

                {errors.participants && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.participants}</span>
                  </p>
                )}
              </div>

              {/* Comentario opcional */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
                  Comentario (opcional)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Agrega detalles adicionales sobre el gasto..."
                  value={formData.comment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleAddAnother}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Agregar otro gasto</span>
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveAndReturn}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-5 h-5" />
                      <span>Guardar y volver</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
