"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { LogIn, Loader2 } from "lucide-react"
import Image from "next/image"

export function LoginScreen() {
  const { loginWithGoogle, loading } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true)
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error("Error during login:", error)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <Image
                src="/cow-logo.svg"
                alt="Vaquitapp"
                width={64}
                height={64}
                className="filter brightness-0 invert"
              />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vaquitapp
            </CardTitle>
            <p className="text-muted-foreground text-lg">Divide gastos entre amigos de forma fácil y eficiente</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-primary">¡Bienvenido al rebaño! 🐄</h2>
            <p className="text-muted-foreground">Inicia sesión para comenzar a dividir gastos con tus amigos</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading || isLoggingIn}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            size="lg"
          >
            {loading || isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-3" />
                Continuar con Google
              </>
            )}
          </Button>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Características</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
                <div className="p-2 bg-accent/20 rounded-full">
                  <span className="text-accent-foreground">💰</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-accent-foreground">Divide gastos fácilmente</div>
                  <div className="text-xs text-muted-foreground">Calcula automáticamente quién debe qué</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                <div className="p-2 bg-primary/20 rounded-full">
                  <span className="text-primary">👥</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-primary">Grupos de amigos</div>
                  <div className="text-xs text-muted-foreground">Crea grupos para diferentes ocasiones</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-xl">
                <div className="p-2 bg-secondary/20 rounded-full">
                  <span className="text-secondary-foreground">📱</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-secondary-foreground">Sincronización en tiempo real</div>
                  <div className="text-xs text-muted-foreground">Todos ven los cambios al instante</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ahora dividir los gastos es muuuuuy facil! 🐄
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
