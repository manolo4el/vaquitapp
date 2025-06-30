"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { useAuth } from "@/hooks/use-auth"
import { loginWithGoogle } from "@/lib/auth"
import { Users, Calculator, Share2, Shield } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true)
      await loginWithGoogle()
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error en login:", error)
      alert(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleJoinGroup = () => {
    if (inviteCode.trim()) {
      router.push(`/invite/${inviteCode.trim().toUpperCase()}`)
    }
  }

  // Si está cargando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <VaquitappLogo size={60} className="justify-center mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si ya está logueado, redirigir al dashboard
  if (user) {
    router.push("/dashboard")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <VaquitappLogo size={60} className="justify-center mb-4" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <VaquitappLogo size={50} />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Divide gastos con
            <span className="text-primary block">tus amigos</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            La forma más fácil de dividir gastos, llevar cuentas claras y mantener la amistad intacta.
          </p>
        </div>

        {/* Auth Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* Login Card */}
          <Card className="p-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Comenzar</CardTitle>
              <CardDescription>Inicia sesión para crear grupos y dividir gastos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full" size="lg">
                {isLoggingIn ? "Iniciando sesión..." : "Continuar con Google"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Group Card */}
          <Card className="p-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Unirse a un grupo</CardTitle>
              <CardDescription>¿Te invitaron a un grupo? Ingresa el código aquí</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Código de invitación</Label>
                <Input
                  id="invite-code"
                  placeholder="Ej: ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleJoinGroup}
                disabled={!inviteCode.trim()}
                variant="outline"
                className="w-full bg-transparent"
                size="lg"
              >
                Unirse al grupo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            ¿Por qué elegir VaquitApp?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Grupos fáciles</h3>
              <p className="text-gray-600 dark:text-gray-300">Crea grupos con tus amigos en segundos</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cálculo automático</h3>
              <p className="text-gray-600 dark:text-gray-300">Dividimos los gastos automáticamente</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fácil de compartir</h3>
              <p className="text-gray-600 dark:text-gray-300">Invita amigos con un simple código</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguro y privado</h3>
              <p className="text-gray-600 dark:text-gray-300">Tus datos están seguros con nosotros</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 VaquitApp. Hecho con ❤️ para dividir gastos entre amigos.</p>
      </footer>
    </div>
  )
}
