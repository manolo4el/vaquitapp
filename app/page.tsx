"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Users, Calculator, TrendingUp, Smartphone } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import { VaquitappLogo } from "@/components/vaquitapp-logo"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (!isLoading && isAuthenticated) {
      window.location.href = "/dashboard"
    }
  }, [isAuthenticated, isLoading])

  const handleGetStarted = () => {
    window.location.href = "/login"
  }

  const handleLogin = () => {
    window.location.href = "/login"
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lime-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <VaquitappLogo size="md" showText={true} />
            <Button
              onClick={handleLogin}
              variant="outline"
              className="bg-white/50 hover:bg-white/80 border-lime-300 text-lime-700 hover:text-lime-800"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <VaquitappLogo size="xl" showText={false} />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Divide gastos
            <br />
            <span className="bg-gradient-to-r from-lime-500 to-violet-500 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            La forma más fácil de dividir gastos con amigos, familia o compañeros. Crea grupos, agrega gastos y deja que
            nosotros calculemos quién debe qué.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6 px-8 text-lg font-medium rounded-xl"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Comenzar gratis
            </Button>

            <p className="text-sm text-gray-500">No se requiere tarjeta de crédito</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/70 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Users className="w-6 h-6 text-lime-600" />
              </div>
              <CardTitle className="text-lg">Grupos Fáciles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Crea grupos en segundos e invita a tus amigos con un simple link
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-violet-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Calculator className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle className="text-lg">Cálculo Automático</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Algoritmos inteligentes calculan la forma más eficiente de saldar deudas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Seguimiento Real</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Ve en tiempo real quién debe qué y mantén todo organizado</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-lime-600" />
              </div>
              <CardTitle className="text-lg">100% Móvil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Funciona perfectamente en cualquier dispositivo, donde sea que estés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-lime-50 to-violet-50 border-lime-200 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Listo para simplificar tus gastos compartidos?</h2>
              <p className="text-gray-600 mb-6">
                Únete a miles de usuarios que ya dividen sus gastos de forma inteligente
              </p>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-lime-500 to-violet-500 hover:from-lime-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6 px-8 text-lg font-medium rounded-xl"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Empezar ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <VaquitappLogo size="sm" showText={true} />
            <p className="text-gray-500 mt-4">© 2024 Vaquitapp. Hecho con ❤️ para simplificar tus gastos compartidos.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
