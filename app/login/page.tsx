"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { loginWithGoogle, getPendingInvite, clearPendingInvite } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { VaquitappLogo } from "@/components/vaquitapp-logo"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingInvite, setPendingInviteState] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Si ya está autenticado, redirigir
    if (isAuthenticated) {
      const invite = getPendingInvite()
      if (invite) {
        clearPendingInvite()
        window.location.href = `/invite/${invite}`
      } else {
        window.location.href = "/dashboard"
      }
      return
    }

    // Verificar si hay una invitación pendiente
    const invite = getPendingInvite()
    setPendingInviteState(invite)
  }, [isAuthenticated])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("Intentando login con Google...")

      // Realizar login con Firebase
      const user = await loginWithGoogle()
      console.log("Login exitoso, usuario:", user)

      // Si hay una invitación pendiente, redirigir al grupo
      if (pendingInvite) {
        clearPendingInvite()
        window.location.href = `/invite/${pendingInvite}`
      } else {
        // Si no hay invitación, ir al dashboard
        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      console.error("Error en login:", error)

      // Mostrar error más específico
      let errorMessage = "Error al iniciar sesión"

      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Botón de volver */}
      <div className="absolute top-6 left-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full p-2 hover:bg-white/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Contenido principal */}
      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <VaquitappLogo size="lg" showText={true} />
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            {pendingInvite ? (
              <p className="text-gray-600">Inicia sesión para unirte al grupo</p>
            ) : (
              <p className="text-gray-600">Accede a tus grupos de gastos compartidos</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Información sobre invitación pendiente */}
            {pendingInvite && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <strong>🎉 Te invitaron a un grupo!</strong>
                  <br />
                  Después de iniciar sesión, te unirás automáticamente.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Botón de Google */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 py-6 text-lg font-medium rounded-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </Button>

            {/* Información adicional */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
