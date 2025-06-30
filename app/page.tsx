"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user, loading, signIn } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signIn()
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
      alert("Error al iniciar sesión. Por favor intenta de nuevo.")
    } finally {
      setIsSigningIn(false)
    }
  }

  // Si el usuario ya está logueado, redirigir al dashboard
  if (user && !loading) {
    router.push("/dashboard")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 p-4">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-yellow-200 rounded-full opacity-30 animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-20 h-20 bg-orange-200 rounded-full opacity-25 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-green-300 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <VaquitappLogo size={80} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">¡Bienvenido! 🎉</CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Divide gastos con tus amigos de forma fácil y divertida
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">💰 Crea grupos • 📊 Divide gastos • 💸 Liquida deudas</p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Iniciando sesión...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-400">Al continuar, aceptas nuestros términos y condiciones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
