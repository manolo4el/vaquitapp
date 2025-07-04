"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { FirebaseDiagnostics } from "@/components/firebase-diagnostics"
import { Calculator, Users, DollarSign, Heart, Loader2, AlertTriangle, X } from "lucide-react"
import Image from "next/image"

export function LoginScreen() {
  const { login, authError, clearError } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    setIsLoggingIn(true)
    try {
      await login()
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      // Solo resetear si no estamos haciendo redirect
      setTimeout(() => setIsLoggingIn(false), 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 cow-pattern opacity-5"></div>
      <div className="absolute top-10 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-3xl shadow-lg">
              <Image
                src="/cow-logo.svg"
                alt="Cow Logo"
                width={64}
                height={64}
                className="text-white filter brightness-0 invert"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vaquitapp
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">¡Divide gastos con tus amigos de forma súper fácil! 🐄</p>
        </div>

        {/* Mostrar errores si los hay */}
        {authError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <strong>Error de autenticación:</strong>
                  <br />
                  {authError}
                  {authError.includes("dominio") && (
                    <div className="mt-2 text-xs">
                      <strong>Posible solución:</strong> El administrador debe agregar este dominio a los dominios
                      autorizados en Firebase.
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearError} className="ml-2 h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-primary">¡Bienvenido!</CardTitle>
            <CardDescription className="text-base">
              Únete a la manada y comienza a dividir gastos
              <br />
              <span className="text-xs text-muted-foreground">Puedes usar cualquier cuenta de Google</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-accent/10">
                <div className="p-2 bg-accent/20 rounded-full">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-accent-foreground">Crea grupos</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-secondary/10">
                <div className="p-2 bg-secondary/20 rounded-full">
                  <DollarSign className="h-5 w-5 text-secondary-foreground" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">Suma gastos</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-primary/10">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Calcula todo</span>
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2 animate-bounce" />
              <p className="text-sm text-muted-foreground">¡Sin complicaciones, sin deudas olvidadas!</p>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Conectando con Google...
                </>
              ) : (
                <>🐄 Entrar con Google</>
              )}
            </Button>

            {isLoggingIn && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">🔄 Intentando abrir popup de Google...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Si no aparece el popup, te redirigiremos automáticamente
                </p>
              </div>
            )}

            {/* Información sobre múltiples usuarios */}
            <div className="text-center p-3 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ✨ <strong>Múltiples usuarios bienvenidos:</strong> Cada persona puede usar su propia cuenta de Google
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">¡Muuuy fácil de usar! 🎉</p>
        </div>
      </div>

      {/* Componente de diagnóstico */}
      <FirebaseDiagnostics />
    </div>
  )
}
