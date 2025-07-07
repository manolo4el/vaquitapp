"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Users, AlertTriangle, CheckCircle, UserPlus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { getGroupByInvitationId } from "@/lib/invitations"

interface GroupJoinPageProps {
  invitationId: string
  onNavigate: (page: string, groupId?: string) => void
}

export function GroupJoinPage({ invitationId, onNavigate }: GroupJoinPageProps) {
  const { user, userProfile } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    const loadGroup = async () => {
      if (!invitationId || !user) return

      try {
        const groupData = await getGroupByInvitationId(invitationId)

        if (groupData) {
          setGroup(groupData)

          // Verificar si ya es miembro
          if (groupData.members.includes(user.uid)) {
            setAlreadyMember(true)
          }
        } else {
          setError("La invitación no existe, ha expirado o el enlace es inválido")
        }
      } catch (err) {
        setError("Error al cargar la invitación")
        console.error("Error loading group by invitation:", err)
      } finally {
        setLoading(false)
      }
    }

    loadGroup()
  }, [invitationId, user])

  const joinGroup = async () => {
    if (!user || !group) return

    // Verificar si tiene información de pago
    if (!userProfile?.paymentInfo) {
      toast({
        title: "Información requerida",
        description: "Necesitas completar tu información de pago antes de unirte al grupo",
        variant: "destructive",
      })
      onNavigate("profile")
      return
    }

    setJoining(true)
    try {
      const groupRef = doc(db, "groups", group.id)
      await updateDoc(groupRef, {
        members: arrayUnion(user.uid),
      })

      toast({
        title: "¡Bienvenido al rebaño! 🐄",
        description: `Te has unido exitosamente a "${group.name}"`,
      })

      // Navegar directamente al dashboard y limpiar la URL
      window.history.replaceState({}, "", window.location.pathname)
      onNavigate("dashboard")
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo unir al grupo. Intenta de nuevo.",
        variant: "destructive",
      })
      console.error("Error joining group:", err)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-bounce">
            <Image src="/cow-logo.svg" alt="Loading" width={48} height={48} className="opacity-60 mx-auto" />
          </div>
          <p className="text-muted-foreground">Cargando invitación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 p-6 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive mb-2">¡Ups! Algo salió mal</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => onNavigate("dashboard")} className="bg-primary hover:bg-primary/90">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alreadyMember) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 p-6 bg-accent/10 rounded-full">
              <CheckCircle className="h-12 w-12 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-accent-foreground mb-2">¡Ya eres parte del rebaño! 🐄</h3>
            <p className="text-muted-foreground text-center mb-4">Ya eres miembro de "{group.name}"</p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  window.history.replaceState({}, "", window.location.pathname)
                  onNavigate("group-details", group.id)
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Ver grupo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.history.replaceState({}, "", window.location.pathname)
                  onNavigate("dashboard")
                }}
                className="border-primary/20 hover:bg-primary/10"
              >
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de invitación */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-bounce">
            <Users className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¡Te invitaron a un rebaño!
          </span>{" "}
          <span className="inline-block">🎉</span>
        </h1>
        <p className="text-muted-foreground">Únete para dividir gastos con tus amigos</p>
      </div>

      {/* Información del grupo */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <Users className="h-6 w-6" />
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-secondary/20 rounded-xl">
            <div>
              <div className="font-medium text-primary">Miembros actuales</div>
              <div className="text-sm text-muted-foreground">
                {group.members.length} vaca{group.members.length !== 1 ? "s" : ""} en el rebaño
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">{group.members.length}</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent/20 rounded-full">
                <UserPlus className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-accent-foreground mb-1">¿Qué puedes hacer?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Agregar gastos al grupo</li>
                  <li>• Ver el balance de todos</li>
                  <li>• Recibir notificaciones de nuevos gastos</li>
                  <li>• Dividir cuentas de forma automática</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificación de información de pago */}
      {!userProfile?.paymentInfo && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Información requerida:</strong> Necesitas completar tu CBU/CVU/ALIAS en tu perfil antes de unirte al
            grupo. Esto es necesario para que otros miembros sepan dónde transferirte dinero.
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="space-y-3">
        <Button
          onClick={joinGroup}
          disabled={joining}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground"
        >
          {joining ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              Uniéndose al rebaño...
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2" />🐄 ¡Unirme al rebaño!
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            // Limpiar la URL y ir al dashboard
            window.history.replaceState({}, "", window.location.pathname)
            onNavigate("dashboard")
          }}
          className="w-full border-primary/20 hover:bg-primary/10"
        >
          Tal vez después
        </Button>
      </div>

      {/* Información adicional */}
      <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Una vez que te unas, podrás ver todos los gastos del grupo y las transferencias
          necesarias
        </p>
      </div>
    </div>
  )
}
