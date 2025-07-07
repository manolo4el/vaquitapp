"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { ArrowLeft, Users, UserPlus, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { getUserDisplayName } from "@/lib/calculations"
import { useAnalytics } from "@/hooks/use-analytics"
import { createNotification } from "@/lib/notifications"

interface GroupJoinPageProps {
  groupId: string
  onNavigate: (page: string, groupId?: string) => void
}

export function GroupJoinPage({ groupId, onNavigate }: GroupJoinPageProps) {
  const { user, userProfile } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { trackGroupAction } = useAnalytics()

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId || !user) return

      try {
        setLoading(true)
        setError(null)

        // Cargar datos del grupo
        const groupDoc = await getDoc(doc(db, "groups", groupId))

        if (!groupDoc.exists()) {
          setError("El grupo no existe o el enlace es inválido")
          return
        }

        const groupData = { id: groupDoc.id, ...groupDoc.data() }
        setGroup(groupData)

        // Verificar si el usuario ya es miembro
        if (groupData.members.includes(user.uid)) {
          // Si ya es miembro, redirigir al grupo
          onNavigate("group-details", groupId)
          return
        }

        // Cargar datos de usuarios existentes en el grupo
        const usersPromises = groupData.members.map((uid: string) => getDoc(doc(db, "users", uid)))
        const usersSnaps = await Promise.all(usersPromises)
        const usersDataMap: any = {}

        usersSnaps.forEach((snap) => {
          if (snap.exists()) {
            usersDataMap[snap.id] = snap.data()
          }
        })

        setUsersData(usersDataMap)
      } catch (error: any) {
        console.error("Error loading group data:", error)
        setError("Error al cargar la información del grupo")
      } finally {
        setLoading(false)
      }
    }

    loadGroupData()
  }, [groupId, user, onNavigate])

  const joinGroup = async () => {
    if (!user || !group || joining) return

    try {
      setJoining(true)

      // Verificar que el usuario tenga perfil completo
      if (!userProfile?.paymentInfo) {
        toast({
          title: "Perfil incompleto",
          description: "Completa tu información de pago antes de unirte al grupo",
          variant: "destructive",
        })
        onNavigate("profile")
        return
      }

      // 1. Crear documento de invitación en Firestore
      const invitationData = {
        groupId: groupId,
        groupName: group.name,
        invitedUserId: user.uid,
        invitedUserEmail: user.email,
        invitedUserName: userProfile.displayName || userProfile.email || "Usuario",
        status: "accepted",
        acceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        invitedBy: group.createdBy || "system", // Si no hay createdBy, usar system
      }

      await addDoc(collection(db, "invitations"), invitationData)

      // 2. Actualizar el grupo agregando al usuario a los miembros
      const groupRef = doc(db, "groups", groupId)
      await updateDoc(groupRef, {
        members: arrayUnion(user.uid),
        lastActivity: serverTimestamp(),
      })

      // 3. Crear notificación para los miembros existentes
      const newMemberName = userProfile.displayName || userProfile.email || "Nuevo miembro"
      const message = `${newMemberName} se unió al grupo "${group.name}"`

      // Crear notificaciones para todos los miembros existentes
      const notificationPromises = group.members.map((memberId: string) =>
        createNotification({
          userId: memberId,
          type: "added_to_group",
          message,
          groupId,
        }),
      )
      await Promise.all(notificationPromises)

      // 4. Tracking de analytics
      trackGroupAction("group_joined", groupId, {
        user_id: user.uid,
        group_member_count: group.members.length + 1,
      })

      console.log("✅ Invitación persistida en Firestore:", invitationData)

      toast({
        title: "¡Te uniste al rebaño! 🐄",
        description: `Ahora eres parte de "${group.name}"`,
      })

      // Redirigir al grupo
      onNavigate("group-details", groupId)
    } catch (error: any) {
      console.error("❌ Error joining group:", error)
      toast({
        title: "Error",
        description: "No se pudo unir al grupo. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando invitación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("dashboard")}
            className="border-primary/20 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Invitación a Grupo</h1>
        </div>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => onNavigate("dashboard")} className="bg-primary hover:bg-primary/90">
                Volver al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="border-primary/20 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">Invitación a Grupo</h1>
      </div>

      {/* Información del Grupo */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-full">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
            <div className="text-lg font-semibold text-accent-foreground mb-2">
              ¡Te invitaron a unirte a este rebaño! 🐄
            </div>
            <div className="text-sm text-muted-foreground">
              {group.members.length} miembro{group.members.length !== 1 ? "s" : ""} ya forman parte
            </div>
          </div>

          {/* Miembros actuales */}
          <div className="space-y-3">
            <div className="font-medium text-primary">Miembros actuales:</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {group.members.map((memberId: string) => (
                <div key={memberId} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  {usersData[memberId]?.photoURL ? (
                    <Image
                      src={usersData[memberId].photoURL || "/placeholder.svg"}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="font-medium text-sm">{getUserDisplayName(memberId, usersData)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificación de perfil */}
      {!userProfile?.paymentInfo && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-medium text-sm">Perfil incompleto</div>
                <div className="text-xs text-muted-foreground">
                  Necesitas completar tu información de pago para unirte
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate("profile")}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Completar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de unirse */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">¿Listo para unirte?</h3>
            <p className="text-sm text-muted-foreground">
              Podrás dividir gastos y mantener un registro de las deudas con el grupo
            </p>
          </div>

          <Button
            onClick={joinGroup}
            disabled={joining || !userProfile?.paymentInfo}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary h-12 text-base"
          >
            {joining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uniéndose...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Unirse al Rebaño
              </>
            )}
          </Button>

          {!userProfile?.paymentInfo && (
            <p className="text-xs text-muted-foreground">Completa tu perfil primero para poder unirte</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
