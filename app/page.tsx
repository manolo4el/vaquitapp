"use client"

import { Button } from "@/components/ui/button"
import { Users, Heart, Coffee, Coins, UserPlus, Calculator } from "lucide-react"
import { useEffect } from "react"
import { initializeAuth } from "@/lib/auth"
import { VaquitappLogo } from "@/components/vaquitapp-logo"

export default function WelcomePage() {
  useEffect(() => {
    // Verificar autenticación usando Firebase
    initializeAuth().then((user) => {
      if (user) {
        window.location.href = "/dashboard"
      }
    })
  }, [])

  const handleGoogleLogin = () => {
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-violet-50 to-orange-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Íconos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Users className="absolute top-20 left-10 w-8 h-8 text-lime-200 opacity-20 animate-pulse" />
        <Coffee className="absolute top-32 right-16 w-6 h-6 text-violet-200 opacity-25 animate-bounce" />
        <Coins className="absolute bottom-40 left-20 w-7 h-7 text-orange-200 opacity-20 animate-pulse" />
        <UserPlus className="absolute bottom-60 right-12 w-6 h-6 text-lime-200 opacity-25" />
        <Calculator className="absolute top-40 left-1/3 w-5 h-5 text-violet-200 opacity-20 animate-bounce" />
        <Heart className="absolute bottom-32 right-1/4 w-4 h-4 text-orange-200 opacity-30" />
      </div>

      {/* Contenido principal */}
      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Logo/Título */}
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <VaquitappLogo size="xl" showText={true} />
          </div>

          {/* Tagline */}
          <p className="text-xl text-gray-700 font-medium leading-relaxed">Dividí gastos fácil, rápido y justo.</p>

          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            La forma más simple de manejar gastos compartidos con tus amigos
          </p>
        </div>

        {/* Botón de Google */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 py-6 text-lg font-medium rounded-xl"
          >
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
          </Button>
        </div>

        {/* Características destacadas */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="bg-lime-100 p-2 rounded-lg mx-auto w-fit">
              <Calculator className="w-5 h-5 text-lime-600" />
            </div>
            <p className="text-xs text-gray-600">Cálculo automático</p>
          </div>
          <div className="text-center space-y-2">
            <div className="bg-violet-100 p-2 rounded-lg mx-auto w-fit">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-xs text-gray-600">Grupos fáciles</p>
          </div>
          <div className="text-center space-y-2">
            <div className="bg-orange-100 p-2 rounded-lg mx-auto w-fit">
              <Coins className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600">Transferencias óptimas</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center space-x-1">
          <span>Hecho con</span>
          <Heart className="w-4 h-4 text-red-400 fill-current" />
          <span>para reuniones entre amigos</span>
        </p>
      </div>
    </div>
  )
}
