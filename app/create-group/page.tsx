"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Plus } from "lucide-react"
import { useState } from "react"
import { createGroup } from "@/lib/group-storage"
import { AuthGuard } from "@/components/auth-guard"

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleBack = () => {
    window.location.href = "/dashboard"
  }

  const handleCreateGroup = async () => {
    setIsLoading(true)
    try {
      // Simular delay de creación
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Crear grupo
      const newGroup = createGroup(groupName)

      // Redirigir al grupo
      window.location.href = `/group/${newGroup.id}`
    } catch (error) {
      console.error("Error al crear grupo:", error)
      alert("Error al crear grupo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Nuevo Grupo</h1>
                <p className="text-sm text-gray-500">Crea un nuevo grupo para dividir gastos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-coral-500" />
                <span>Datos del Grupo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre del grupo */}
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-sm font-medium text-gray-700">
                  Nombre del grupo
                </Label>
                <Input
                  id="groupName"
                  placeholder="ej: Vacaciones en Bariloche, Cena de amigos..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="py-6 text-lg"
                />
              </div>

              {/* Botón crear */}
              <Button
                onClick={handleCreateGroup}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creando grupo...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Crear grupo</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
