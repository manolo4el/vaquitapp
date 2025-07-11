"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogIn, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LoginScreenProps {
  onNavigate?: (page: string) => void
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const { loginWithGoogle, loading } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error("Error during login:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <Image
                src="/cow-logo.svg"
                alt="Vaquitapp"
                width={48}
                height={48}
                className="filter brightness-0 invert"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vaquitapp
            </h1>
            <p className="text-muted-foreground">Organiza gastos entre amigos de forma simple y colaborativa</p>
          </div>
        </div>

        {/* Card de login */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">¡Bienvenido!</CardTitle>
            <CardDescription>Inicia sesión para comenzar a organizar tus gastos grupales</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Botón de Google */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
              {loading ? "Iniciando sesión..." : "Continuar con Google"}
            </Button>

            <Separator className="my-6" />

            {/* Información adicional */}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Al iniciar sesión, aceptas nuestros términos de servicio</p>
              <div className="flex items-center justify-center space-x-4 text-xs">
                <span className="text-muted-foreground">🔒 Seguro</span>
                <span className="text-muted-foreground">🚀 Rápido</span>
                <span className="text-muted-foreground">👥 Colaborativo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Características principales */}
        <div className="grid grid-cols-1 gap-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>💰</span>
            <span>Divide gastos automáticamente</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>📱</span>
            <span>Notificaciones en tiempo real</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>🔄</span>
            <span>Sincronización automática</span>
          </div>
        </div>

        {/* Link discreto a política de privacidad */}
        <div className="text-center pt-4">
          <Link
            href="/policy"
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            Política de privacidad
          </Link>
        </div>
      </div>
    </div>
  )
}
