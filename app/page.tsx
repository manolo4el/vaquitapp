"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Users, Calculator, Share2, Smartphone } from "lucide-react"

export default function HomePage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <VaquitappLogo size="xl" />
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-green-700">Cargando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
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
            <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-4">
              Gestiona gastos
              <span className="block text-yellow-600">con amigos</span>
            </h1>
            <p className="text-xl text-green-700 mb-8 max-w-2xl mx-auto">
              La forma más fácil de dividir gastos, hacer seguimiento de deudas y mantener las cuentas claras con tus
              amigos.
            </p>

            {/* Login Button */}
            <Card className="max-w-md mx-auto mb-12 border-2 border-green-200 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-green-800">¡Empezá ahora!</CardTitle>
                <CardDescription className="text-green-600">Iniciá sesión con Google para comenzar</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={login}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loading ? (
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
            <Card className="border-yellow-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <CardTitle className="text-lg text-green-800">Grupos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-center">
                  Creá grupos para diferentes ocasiones y agregá a tus amigos fácilmente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <Calculator className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <CardTitle className="text-lg text-green-800">Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-center">
                  Registrá gastos y dividílos automáticamente entre los miembros del grupo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <Share2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg text-green-800">Liquidación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-center">
                  Calculá automáticamente quién le debe a quién y liquidá deudas fácilmente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <Smartphone className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <CardTitle className="text-lg text-green-800">Móvil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-center">
                  Accedé desde cualquier dispositivo, siempre tendrás tus gastos al día.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto border-2 border-green-300 bg-gradient-to-r from-green-100 to-yellow-100">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">
                  ¿Listo para simplificar tus gastos compartidos?
                </CardTitle>
                <CardDescription className="text-lg text-green-700">
                  Unite a miles de usuarios que ya gestionan sus gastos de forma inteligente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={login}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white font-bold py-3 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Empezar gratis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center text-green-600">
          <VaquitappLogo size="sm" className="justify-center mb-2" />
          <p className="text-sm">© 2024 VaquitApp. Hecho con ❤️ para simplificar tus gastos compartidos.</p>
        </div>
      </footer>
    </div>
  )
}
