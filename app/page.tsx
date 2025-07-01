"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { loginWithGoogle } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Users, Calculator, Share2, Shield } from "lucide-react"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await loginWithGoogle()
      router.push("/dashboard")
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if already logged in
  if (user && !loading) {
    router.push("/dashboard")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <VaquitappLogo size="lg" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Gestiona gastos compartidos
              <span className="block text-green-600">de forma simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Divide gastos con amigos, lleva el control de quién debe qué, y liquida cuentas fácilmente.
            </p>

            {/* Login Button */}
            <Card className="max-w-md mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900">¡Empezá ahora!</CardTitle>
                <CardDescription>
                  Iniciá sesión con Google para comenzar a gestionar tus gastos compartidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Grupos</h3>
              <p className="text-sm text-gray-600">Creá grupos para diferentes ocasiones y agregá a tus amigos</p>
            </Card>

            <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gastos</h3>
              <p className="text-sm text-gray-600">Registrá gastos y dividí automáticamente entre los participantes</p>
            </Card>

            <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Compartir</h3>
              <p className="text-sm text-gray-600">Invitá amigos con códigos únicos y mantené todo sincronizado</p>
            </Card>

            <Card className="text-center p-6 bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
              <p className="text-sm text-gray-600">Tus datos están protegidos y solo vos controlás tu información</p>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">¿Por qué elegir VaquitApp?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple y rápido</h3>
                <p className="text-gray-600">Interfaz intuitiva que hace que dividir gastos sea pan comido</p>
              </div>
              <div>
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparente</h3>
                <p className="text-gray-600">Todos ven los gastos y balances en tiempo real</p>
              </div>
              <div>
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin complicaciones</h3>
                <p className="text-gray-600">No más cálculos manuales ni discusiones sobre quién debe qué</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>&copy; 2024 VaquitApp. Hecho con ❤️ para simplificar tus gastos compartidos.</p>
      </footer>
    </div>
  )
}
