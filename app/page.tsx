"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VaquitappLogo } from "@/components/vaquitapp-logo"
import { useAuth } from "@/hooks/use-auth"
import { Users, Calculator, Share2, Smartphone } from "lucide-react"

export default function HomePage() {
  const { user, loading, signIn } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn()
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
    } finally {
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <VaquitappLogo size={60} />
          <p className="mt-4 text-green-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <VaquitappLogo size={60} className="justify-center mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">¡Bienvenido, {user.name}!</h1>
            <p className="text-green-600">¿Qué quieres hacer hoy?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-green-800">Crear Grupo</CardTitle>
                <CardDescription>Crea un nuevo grupo para dividir gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-green-600 hover:bg-green-700">Crear Grupo</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
              <CardHeader className="text-center">
                <Share2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-green-800">Unirse a Grupo</CardTitle>
                <CardDescription>Únete a un grupo existente con un código</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
                >
                  Unirse
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Mis Grupos</h2>
            <Card className="max-w-md mx-auto border-green-200">
              <CardContent className="py-8">
                <Users className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-green-600">No tienes grupos aún</p>
                <p className="text-sm text-green-500 mt-2">Crea tu primer grupo para empezar</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <VaquitappLogo size={50} />
          <Button onClick={handleSignIn} disabled={isSigningIn} className="bg-green-600 hover:bg-green-700">
            {isSigningIn ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-green-800 mb-6">Divide gastos con tus amigos de forma fácil</h1>
          <p className="text-xl text-green-600 mb-8 max-w-2xl mx-auto">
            VaquitApp te ayuda a llevar un control claro de los gastos compartidos. Sin complicaciones, sin deudas
            olvidadas.
          </p>
          <Button
            size="lg"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
          >
            {isSigningIn ? "Iniciando..." : "Comenzar Gratis"}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-green-800 mb-12">¿Por qué elegir VaquitApp?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center border-green-200">
            <CardHeader>
              <Calculator className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Cálculo Automático</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                Calcula automáticamente quién debe qué a quién. Sin matemáticas complicadas.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Grupos Ilimitados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                Crea tantos grupos como necesites. Viajes, cenas, gastos del hogar y más.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200">
            <CardHeader>
              <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Fácil de Usar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                Interfaz simple e intuitiva. Agrega gastos en segundos desde cualquier dispositivo.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para simplificar tus gastos compartidos?</h2>
          <p className="text-green-100 mb-8 text-lg">Únete a miles de usuarios que ya confían en VaquitApp</p>
          <Button
            size="lg"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 py-3"
          >
            {isSigningIn ? "Iniciando..." : "Empezar Ahora"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <VaquitappLogo size={40} className="justify-center mb-4" />
          <p className="text-green-200">© 2024 VaquitApp. Hecho con ❤️ para simplificar tus gastos.</p>
        </div>
      </footer>
    </div>
  )
}
