"use client"

import { useAuth } from "@/hooks/use-auth"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calculator, Share2, Shield } from "lucide-react"

export default function HomePage() {
  const { user, loading, signIn } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <VaquitappLogo size="lg" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    // Redirect to dashboard if user is logged in
    window.location.href = "/dashboard"
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <VaquitappLogo size="md" showText />
          <Button onClick={signIn} variant="outline">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <VaquitappLogo size="xl" className="mx-auto mb-8" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Divide gastos con <span className="text-green-600">amigos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La forma más fácil de gestionar gastos grupales. Crea grupos, añade gastos y mantén todo organizado.
          </p>
          <Button onClick={signIn} size="lg" className="bg-green-600 hover:bg-green-700">
            Comenzar Gratis
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Grupos Fáciles</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">Crea grupos con amigos y familiares en segundos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Calculator className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Cálculo Automático</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Divide gastos automáticamente entre los miembros
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Share2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Comparte Fácil</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Invita miembros con un simple código de invitación
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Seguro y Privado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Tus datos están seguros con autenticación Google
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Listo para simplificar tus gastos grupales?</h2>
          <p className="text-gray-600 mb-6">Únete a miles de usuarios que ya gestionan sus gastos con Vaquitapp</p>
          <Button onClick={signIn} size="lg" className="bg-green-600 hover:bg-green-700">
            Crear Cuenta Gratis
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 Vaquitapp. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
