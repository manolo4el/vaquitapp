"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { getGroupByInviteCodeFirestore, addMemberToGroupFirestore } from "@/lib/group-firestore"
import { getCurrentUser, setPendingInvite } from "@/lib/auth"
import type { Group } from "@/lib/group-storage"
import { getAllGroups } from "@/lib/group-storage"

export default function InvitePage({ params }: { params: { code: string } }) {
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    handleInviteFlow()
  }, [params.code])

  const handleInviteFlow = async () => {
    try {
      console.log("=== PROCESANDO INVITACIÓN ===")
      console.log("Código de invitación:", params.code)

      // 1. Buscar el grupo por código de invitación en Firestore
      const groupData = await getGroupByInviteCodeFirestore(params.code)

      // ✅ Agregar debugging detallado
      console.log("Resultado de búsqueda de grupo en Firestore:", groupData)

      if (!groupData) {
        // ✅ Debugging adicional para ver todos los grupos disponibles
        const allGroups = getAllGroups()
        console.log("❌ Grupo no encontrado")
        console.log(
          "Todos los grupos disponibles:",
          allGroups.map((g) => ({
            id: g.id,
            name: g.name,
            inviteCode: g.inviteCode,
          })),
        )
        console.log("Código buscado:", params.code)

        setError("Código de invitación inválido. Verifica que el link sea correcto.")
        setIsLoading(false)
        return
      }

      console.log("✅ Grupo encontrado:", groupData.name)
      setGroup(groupData)

      // 2. Verificar si el usuario está logueado
      const currentUser = getCurrentUser()
      console.log("Usuario actual:", currentUser)

      if (!currentUser) {
        console.log("❌ Usuario no logueado, guardando invitación pendiente")
        // Guardar la invitación pendiente y redirigir a login
        setPendingInvite(params.code)
        window.location.href = "/login"
        return
      }

      console.log("✅ Usuario logueado:", currentUser.name, "ID:", currentUser.id)

      // 3. Verificar si ya es miembro del grupo
      const isAlreadyMember = groupData.members.some((member) => member.id === currentUser.id)
      console.log("¿Ya es miembro?", isAlreadyMember)
      console.log(
        "Miembros del grupo:",
        groupData.members.map((m) => ({ id: m.id, name: m.name })),
      )

      if (isAlreadyMember) {
        console.log("✅ Usuario ya es miembro, redirigiendo al grupo")
        // Ya es miembro, redirigir directamente al grupo
        window.location.href = `/group/${groupData.id}`
        return
      }

      // 4. Agregar automáticamente al usuario al grupo en Firestore
      console.log("➕ Agregando usuario al grupo automáticamente en Firestore")
      setIsJoining(true)

      await addMemberToGroupFirestore(groupData.id, {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        alias: currentUser.alias,
      })

      console.log("✅ Usuario agregado exitosamente al grupo en Firestore")
      setHasJoined(true)

      // Redirigir al grupo después de 2 segundos
      setTimeout(() => {
        window.location.href = `/group/${groupData.id}`
      }, 2000)
    } catch (error) {
      console.error("❌ Error en el flujo de invitación:", error)
      setError("Hubo un error al procesar la invitación")
    } finally {
      setIsLoading(false)
      setIsJoining(false)
      console.log("=== FIN PROCESAMIENTO INVITACIÓN ===")
    }
  }

  // Estado de carga inicial
  if (isLoading && !isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Procesando invitación...</p>
            <p className="text-sm text-gray-500 mt-2">Código: {params.code}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Link de invitación inválido</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-4">Código: {params.code}</p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
            >
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de unión en proceso
  if (isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Uniéndote al grupo...</h2>
            <p className="text-gray-600">Esto solo tomará un momento</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de éxito (ya se unió)
  if (hasJoined && group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <Card className="bg-lime-50 border-lime-200 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Check className="w-8 h-8 text-lime-600" />
            </div>
            <h2 className="text-xl font-bold text-lime-800 mb-2">¡Te uniste al grupo!</h2>
            <p className="text-lime-700 mb-4">
              Ahora eres parte de <strong>"{group.name}"</strong>
            </p>
            <p className="text-sm text-lime-600">Redirigiendo al grupo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Este estado no debería alcanzarse con el flujo automático
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Procesando...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </CardContent>
      </Card>
    </div>
  )
}
