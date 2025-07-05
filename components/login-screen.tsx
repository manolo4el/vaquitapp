"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Chrome } from "lucide-react"

export function LoginScreen() {
  const { login } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true)
      await login()
    } catch (error) {
      console.error("Error during login:", error)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Bienvenido a VacaGastos</CardTitle>
          <CardDescription className="text-gray-600">Divide gastos fácilmente con tus amigos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
            size="lg"
          >
            <Chrome className="w-5 h-5 mr-2" />
            {isLoggingIn ? "Iniciando sesión..." : "Continuar con Google"}
          </Button>

          <div className="text-center text-sm text-gray-500">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
