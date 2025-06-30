"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { loginWithGoogle, getPendingInvite, clearPendingInvite } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    if (user && !isLoading) {
      console.log("Usuario autenticado, redirigiendo al dashboard")

      // Verificar si hay una invitación pendiente
      const pendingInvite = getPendingInvite()
      if (pendingInvite) {
        console.log("Invitación pendiente encontrada:", pendingInvite)
        clearPendingInvite()
        router.push(`/invite/${pendingInvite}`)
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router])

  const handleGoogleLogin = async () => {
    if (typeof window === "undefined") return

    setIsLoggingIn(true)
    setError(null)

    try {
      console.log("Iniciando proceso de login...")
      await loginWithGoogle()
      console.log("Login completado exitosamente")

      // La redirección se manejará en el useEffect
    } catch (error: any) {
      console.error("Error en login:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Mostrar loading mientras se inicializa la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si el usuario está autenticado, mostrar loading mientras redirige
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <VaquitappLogo className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Bienvenido a VaquitApp</CardTitle>
          <CardDescription className="text-gray-600">
            La forma más simple de manejar gastos compartidos con tus amigos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

          <div className="text-center text-sm text-gray-500">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
