"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { LogIn, AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useAnalytics } from "@/hooks/use-analytics"

export function LoginScreen() {
  const { login, loading, authError, clearError } = useAuth()
  const { trackUserAction } = useAnalytics()

  const handleLogin = async () => {
    trackUserAction("login_attempt", { method: "google" })
    await login()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-bounce">
              <Image src="/cow-logo.svg" alt="Vaquitapp" width={64} height={64} className="opacity-80" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Vaquitapp
              </span>
            </CardTitle>
            <CardDescription className="text-lg mt-2">La forma más fácil de dividir gastos con amigos</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {authError && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {authError}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="ml-2 h-auto p-0 text-destructive hover:text-destructive/80"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold text-base"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Continuar con Google
                </div>
              )}
            </Button>

            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">Al continuar, aceptás nuestros términos y condiciones</div>
            </div>
          </div>

          {/* Features preview */}
          <div className="space-y-4 pt-4 border-t border-primary/10">
            <h3 className="text-sm font-semibold text-primary text-center">¿Qué podés hacer?</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg">
                <div className="text-lg">🐄</div>
                <div>
                  <div className="font-medium text-accent-foreground">Crear rebaños</div>
                  <div className="text-xs text-muted-foreground">Organiza gastos por grupos</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                <div className="text-lg">💰</div>
                <div>
                  <div className="font-medium text-primary">Dividir gastos</div>
                  <div className="text-xs text-muted-foreground">Automáticamente y sin complicaciones</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg">
                <div className="text-lg">📱</div>
                <div>
                  <div className="font-medium text-secondary-foreground">Seguir balances</div>
                  <div className="text-xs text-muted-foreground">Sabe quién debe y a quién</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
