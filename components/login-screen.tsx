"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"
import Image from "next/image"

interface LoginScreenProps {
  onNavigate?: (page: string) => void
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const { signInWithGoogle, loading } = useAuth()

  const handlePrivacyPolicy = () => {
    if (onNavigate) {
      onNavigate("privacy-policy")
    } else {
      // Si no hay navegación interna, ir a la URL directa
      window.location.href = "/policy"
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
            <p className="text-muted-foreground">Organiza gastos con tus amigos de forma simple y colaborativa</p>
          </div>
        </div>

        {/* Card de login */}
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">¡Bienvenido!</CardTitle>
            <CardDescription>Inicia sesión para comenzar a organizar tus gastos grupales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Chrome className="h-5 w-5" />
                  <span>Continuar con Google</span>
                </div>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-2">
              <p>Al iniciar sesión, aceptas nuestros términos de uso y política de privacidad</p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>🔒</span>
            <span>Datos seguros con Google Firebase</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>💸</span>
            <span>Divide gastos automáticamente</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>👥</span>
            <span>Colabora con tus amigos en tiempo real</span>
          </div>
        </div>

        {/* Link discreto a política de privacidad */}
        <div className="text-center pt-4">
          <button
            onClick={handlePrivacyPolicy}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline"
          >
            Política de Privacidad
          </button>
        </div>
      </div>
    </div>
  )
}
