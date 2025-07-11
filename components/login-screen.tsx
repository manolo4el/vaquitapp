"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LoginScreenProps {
  onNavigate?: (page: string) => void
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const { login, loading } = useAuth()

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error("Error during login:", error)
    }
  }

  const handlePrivacyClick = () => {
    if (onNavigate) {
      onNavigate("privacy-policy")
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
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vaquitapp
            </h1>
            <p className="text-muted-foreground mt-2">Organiza gastos entre amigos de forma simple</p>
          </div>
        </div>

        {/* Card de login */}
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">¡Bienvenido!</CardTitle>
            <CardDescription>Inicia sesión para comenzar a organizar tus gastos compartidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Continuar con Google</span>
                </div>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Al continuar, aceptas nuestros términos de servicio
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>🔒</span>
            <span>Seguro y privado</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>📱</span>
            <span>Funciona sin conexión</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>💸</span>
            <span>Divide gastos fácilmente</span>
          </div>
        </div>

        {/* Link discreto a política de privacidad */}
        <div className="text-center pt-4">
          <Link
            href="/policy"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>
    </div>
  )
}
