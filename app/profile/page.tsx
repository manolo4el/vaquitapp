"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, Mail, CreditCard, Check, AlertCircle, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { updateUserProfile, validateAlias } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    alias: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    alias: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        alias: user.alias || "",
      })
    }
  }, [user])

  const handleBack = () => {
    window.history.back()
  }

  const validateForm = (): boolean => {
    const newErrors = { name: "", alias: "" }
    let isValid = true

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
      isValid = false
    }

    // Validar alias
    const aliasValidation = validateAlias(formData.alias)
    if (!aliasValidation.isValid) {
      newErrors.alias = aliasValidation.error || "Alias inválido"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    setIsSaving(true)

    try {
      // Simular delay de guardado
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Actualizar perfil
      const updatedUser = updateUserProfile({
        name: formData.name.trim(),
        alias: formData.alias.trim(),
      })

      if (updatedUser) {
        refreshUser()
        setShowSuccess(true)

        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatAlias = (alias: string) => {
    // Si es un CBU/CVU (22 dígitos), formatearlo con espacios
    if (/^\d{22}$/.test(alias)) {
      return alias.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, "$1 $2 $3 $4 $5 $6")
    }
    return alias
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-emerald-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-sm text-gray-500">Gestiona tu información personal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <p className="text-emerald-800 font-medium">¡Perfil actualizado exitosamente!</p>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white text-2xl">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">Información Personal</CardTitle>
              <p className="text-gray-600">Actualiza tus datos para recibir transferencias</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  placeholder="Ingresa tu nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className={`py-6 text-lg ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Email (solo lectura) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Correo electrónico
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="py-6 text-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Este campo se obtiene automáticamente de tu cuenta de Google</p>
              </div>

              {/* Alias/CBU/CVU */}
              <div className="space-y-2">
                <Label htmlFor="alias" className="text-sm font-medium text-gray-700 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Alias, CBU o CVU *
                </Label>
                <Input
                  id="alias"
                  placeholder="ej: mi.alias.mp, 1234567890123456789012"
                  value={formData.alias}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alias: e.target.value }))}
                  className={`py-6 text-lg font-mono ${errors.alias ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.alias && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.alias}</span>
                  </p>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 text-sm">
                    <strong>Formatos válidos:</strong>
                    <br />• Alias: texto alfanumérico (ej: mi.alias.mp)
                    <br />• CBU/CVU: exactamente 22 dígitos
                  </p>
                </div>
              </div>

              {/* Vista previa del alias formateado */}
              {formData.alias && validateAlias(formData.alias).isValid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-700 text-sm font-medium mb-2">Vista previa:</p>
                  <p className="text-emerald-800 font-mono text-lg">{formatAlias(formData.alias)}</p>
                </div>
              )}

              {/* Botón guardar */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando cambios...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>Guardar cambios</span>
                  </div>
                )}
              </Button>

              {/* Información adicional */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  <strong>¿Por qué necesitamos esta información?</strong>
                  <br />
                  Tu alias/CBU se mostrará a otros miembros del grupo cuando necesiten transferirte dinero, facilitando
                  el proceso de pago de deudas compartidas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
