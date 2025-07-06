"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export function LoginScreen() {
  const { login, authError, clearError } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      clearError()
      await login()
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6 pb-8">
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
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vaquitapp
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Divide gastos con tus amigos de forma fácil y transparente
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {authError && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-sm">{authError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </Button>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="h-px bg-border flex-1" />
              <span className="px-2">¿Por qué Vaquitapp?</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">💰</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Divide gastos fácilmente</p>
                  <p className="text-muted-foreground text-xs">Calcula automáticamente quién debe qué</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-secondary font-bold">👥</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Grupos organizados</p>
                  <p className="text-muted-foreground text-xs">Crea grupos para diferentes ocasiones</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent-foreground font-bold">📱</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Siempre sincronizado</p>
                  <p className="text-muted-foreground text-xs">Accede desde cualquier dispositivo</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
