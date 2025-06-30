"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading, signIn } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)
    try {
      await signIn()
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
        <div className="text-center">
          <VaquitappLogo size="lg" className="justify-center mb-4" />
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto" />
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
        <div className="text-center">
          <VaquitappLogo size="lg" className="justify-center mb-4" />
          <p className="text-green-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-3000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <VaquitappLogo size="xl" className="justify-center mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Hola!</h1>
            <p className="text-gray-600">Divide gastos con tus amigos súper fácil</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm h-12 text-base font-medium mb-6"
            variant="outline"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Iniciando sesión...
              </>
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

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-xs text-gray-600">Grupos fáciles</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🧮</span>
              </div>
              <p className="text-xs text-gray-600">Cálculo automático</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💸</span>
              </div>
              <p className="text-xs text-gray-600">Sin complicaciones</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  )
}
