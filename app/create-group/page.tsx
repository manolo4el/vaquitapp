"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Copy, Check, Share2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { createGroupFirestore } from "@/lib/group-firestore"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { VaquitappLogo } from "@/components/vaquitapp-logo"

interface CreatedGroup {
  id: string
  name: string
  inviteCode: string
  inviteUrl: string
}

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()

  const handleBack = () => {
    window.history.back()
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación
    if (!groupName.trim()) {
      setError("El nombre del grupo es obligatorio")
      return
    }

    if (groupName.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres")
      return
    }

    if (!user) {
      setError("Debes estar autenticado para crear un grupo")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Crear el grupo en Firestore
      const newGroup = await createGroupFirestore(groupName, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        alias: user.alias,
      })
      console.log("Grupo creado exitosamente en Firestore:", newGroup)

      setCreatedGroup({
        id: newGroup.id,
        name: newGroup.name,
        inviteCode: newGroup.inviteCode || "",
        inviteUrl: `${window.location.origin}/invite/${newGroup.inviteCode || ""}`,
      })
    } catch (error: any) {
      console.error("Error al crear grupo:", error)
      setError(error.message || "Hubo un error al crear el grupo. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!createdGroup) return

    try {
      await navigator.clipboard.writeText(createdGroup.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error al copiar:", error)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = createdGroup.inviteUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareLink = async () => {
    if (!createdGroup) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al grupo "${createdGroup.name}"`,
          text: `Te invito a unirte a nuestro grupo de gastos compartidos`,
          url: createdGroup.inviteUrl,
        })
      } catch (error) {
        console.error("Error al compartir:", error)
      }
    } else {
      // Fallback: copiar link
      handleCopyLink()
    }
  }

  const handleGoToGroup = () => {
    if (createdGroup) {
      console.log("Navegando al grupo:", createdGroup.id)
      window.location.href = `/group/${createdGroup.id}`
    }
  }

  const handleCreateAnother = () => {
    setCreatedGroup(null)
    setGroupName("")
    setError("")
  }

  // Pantalla de éxito con link de invitación
  if (createdGroup) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <VaquitappLogo size="sm" showText={true} />
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Confirmación de éxito */}
            <Card className="bg-lime-50 border-lime-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Check className="w-8 h-8 text-lime-600" />
                </div>
                <h2 className="text-xl font-bold text-lime-800 mb-2">¡Listo!</h2>
                <p className="text-lime-700">
                  El grupo <strong>"{createdGroup.name}"</strong> fue creado exitosamente
                </p>
              </CardContent>
            </Card>

            {/* Link de invitación */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-lime-500" />
                  <span>Link de Invitación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Comparte este link con tus amigos para que se unan automáticamente al grupo:
                </p>

                {/* Cuadro del link */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-800 truncate">{createdGroup.inviteUrl}</p>
                      <p className="text-xs text-gray-500 mt-1">Código: {createdGroup.inviteCode}</p>
                      {/* ✅ Agregar debugging visual */}
                      <p className="text-xs text-blue-500 mt-1">
                        Debug: {window.location.origin}/invite/{createdGroup.inviteCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleCopyLink}
                    className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar link
                      </>
                    )}
                  </Button>

                  <Button onClick={handleShareLink} variant="outline" className="flex-1 bg-white/50 hover:bg-white/80">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-1 rounded-full flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800 text-sm">¿Cómo funciona?</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Cualquier persona que abra este link se unirá automáticamente al grupo y podrá ver y agregar
                        gastos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones finales */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGoToGroup}
                className="flex-1 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white py-6 text-lg font-medium"
              >
                <Users className="w-5 h-5 mr-2" />
                Ir al grupo
              </Button>

              <Button
                onClick={handleCreateAnother}
                variant="outline"
                className="flex-1 bg-white/50 hover:bg-white/80 py-6 text-lg font-medium"
              >
                Crear otro grupo
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Pantalla de creación de grupo
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <VaquitappLogo size="sm" showText={true} />
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <VaquitappLogo size="lg" showText={false} />
              </div>
              <CardTitle className="text-2xl">Nuevo Grupo de Gastos</CardTitle>
              <p className="text-gray-600">Dale un nombre a tu grupo para empezar</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-6">
                {/* Campo nombre del grupo */}
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-sm font-medium text-gray-700">
                    Nombre del grupo *
                  </Label>
                  <Input
                    id="groupName"
                    placeholder="ej: Asado del sábado, Viaje a Bariloche..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={`text-lg py-6 ${error ? "border-red-500 focus:border-red-500" : ""}`}
                    maxLength={50}
                  />
                  <div className="flex justify-between items-center">
                    {error && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">{groupName.length}/50 caracteres</p>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <h4 className="font-medium text-violet-800 text-sm mb-2">¿Qué puedes hacer con un grupo?</h4>
                  <ul className="text-violet-700 text-sm space-y-1">
                    <li>• Agregar gastos y dividirlos automáticamente</li>
                    <li>• Ver quién debe y a quién en tiempo real</li>
                    <li>• Recibir sugerencias de transferencias óptimas</li>
                    <li>• Chatear con los miembros del grupo</li>
                  </ul>
                </div>

                {/* Botón crear */}
                <Button
                  type="submit"
                  disabled={isLoading || !groupName.trim()}
                  className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando grupo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Crear grupo</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
