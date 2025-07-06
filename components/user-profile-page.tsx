"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Save, User, CreditCard, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UserProfilePageProps {
  onNavigate: (page: string, groupId?: string) => void
  returnTo?: string
  returnGroupId?: string | null
}

export function UserProfilePage({ onNavigate, returnTo, returnGroupId }: UserProfilePageProps) {
  const { user, userProfile, updatePaymentInfo } = useAuth()
  const [paymentInfo, setPaymentInfo] = useState(userProfile?.paymentInfo || "")
  const [loading, setLoading] = useState(false)

  const handleSavePaymentInfo = async () => {
    if (!paymentInfo.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu CBU/CVU o ALIAS",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await updatePaymentInfo(paymentInfo)
      toast({
        title: "¡Éxito!",
        description: "¡Información de pago actualizada! 🐄",
      })

      // Si viene de un grupo compartido, redirigir de vuelta
      if (returnTo === "group-join" && returnGroupId) {
        setTimeout(() => {
          onNavigate("group-join", returnGroupId)
        }, 1500)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la información",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-6">
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
        <div>
          <h1 className="text-2xl font-bold text-primary">Mi Perfil 👤</h1>
          <p className="text-muted-foreground">Gestiona tu información personal</p>
        </div>
      </div>

      {/* Información personal */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar y nombre */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-muted/30 to-secondary/20 rounded-xl">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL || "/placeholder.svg"}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border-4 border-primary/20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1 bg-accent rounded-full">
                <div className="w-3 h-3 bg-accent-foreground rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-primary">{user?.displayName || "Usuario"}</h3>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
            </div>
          </div>

          {/* Información de solo lectura */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-primary font-medium">Nombre completo</Label>
              <Input value={user?.displayName || ""} disabled className="bg-muted/50 border-muted" />
            </div>

            <div className="space-y-2">
              <Label className="text-primary font-medium">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50 border-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de pago */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent/20 rounded-full">
                <CreditCard className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-accent-foreground mb-1">¡Información importante! 🐄</h4>
                <p className="text-sm text-muted-foreground">
                  Agrega tu CBU, CVU o ALIAS para que tus amigos sepan dónde transferirte cuando te deban dinero. Esta
                  información es <strong>obligatoria</strong> y será visible para los miembros de tus grupos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-info" className="text-primary font-medium">
              CBU / CVU / ALIAS *
            </Label>
            <Input
              id="payment-info"
              placeholder="Ej: 1234567890123456789012, vaca.gastos.mp, etc."
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              className="border-primary/20 focus:border-primary h-12"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa tu CBU (22 dígitos), CVU (22 dígitos) o ALIAS de Mercado Pago/banco
            </p>
          </div>

          <Button
            onClick={handleSavePaymentInfo}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Información"}
          </Button>

          {userProfile?.paymentInfo && (
            <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
              <p className="text-sm text-primary font-medium">✅ Información guardada: {userProfile.paymentInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas del usuario */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">📊 Tus Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl">
              <div className="text-2xl font-bold text-primary">🐄</div>
              <div className="text-sm text-muted-foreground mt-1">Miembro desde</div>
              <div className="text-sm font-medium text-primary">
                {userProfile?.createdAt
                  ? userProfile.createdAt instanceof Date
                    ? userProfile.createdAt.toLocaleDateString("es-AR")
                    : userProfile.createdAt.toDate?.()
                      ? userProfile.createdAt.toDate().toLocaleDateString("es-AR")
                      : new Date(userProfile.createdAt).toLocaleDateString("es-AR")
                  : "Hoy"}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-xl">
              <div className="text-2xl font-bold text-accent-foreground">✨</div>
              <div className="text-sm text-muted-foreground mt-1">Estado</div>
              <div className="text-sm font-medium text-accent-foreground">
                {userProfile?.paymentInfo ? "Perfil completo" : "Perfil incompleto"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
