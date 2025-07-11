"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

interface PrivacyPolicyPageProps {
  onNavigate: (page?: string) => void
}

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  const handleBack = () => {
    onNavigate("login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-lg border-b border-primary/10 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                <Image
                  src="/cow-logo.svg"
                  alt="Vaquitapp"
                  width={24}
                  height={24}
                  className="filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Vaquitapp
                </h1>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-xl border-primary/10">
          <CardContent className="p-8">
            <div className="space-y-6 text-sm leading-relaxed">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-primary mb-2">🛡️ Política de Privacidad – Vaquitapp</h1>
                <p className="text-muted-foreground">Última actualización: Julio 2025</p>
              </div>

              <div className="space-y-6">
                <p className="text-muted-foreground">
                  En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                  facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
                </p>

                <p className="text-muted-foreground">
                  A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                  usuario.
                </p>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">📥 ¿Qué datos recopilamos?</h2>
                  <p className="text-muted-foreground">
                    Al utilizar Vaquitapp, recopilamos únicamente la información necesaria para que la app funcione
                    correctamente:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      <strong>Tu nombre y correo electrónico:</strong> se obtienen al iniciar sesión con tu cuenta de
                      Google.
                    </li>
                    <li>
                      <strong>Datos de pago opcionales:</strong> como tu CBU, CVU o alias para facilitar transferencias
                      dentro de los grupos.
                    </li>
                    <li>
                      <strong>Actividad dentro de la app:</strong> como grupos que creás, gastos que cargás, mensajes y
                      transferencias entre usuarios.
                    </li>
                    <li>
                      <strong>Notificaciones:</strong> relacionadas a acciones que ocurren en grupos donde participás.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">🔒 ¿Cómo protegemos tus datos?</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                    <li>La información está encriptada tanto en tránsito como en reposo.</li>
                    <li>No compartimos tu información con terceros.</li>
                    <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">👤 ¿Quién tiene acceso a tus datos?</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo:
                      alias o gastos en común).
                    </li>
                    <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">🧽 Eliminación de datos y cuenta</h2>
                  <p className="text-muted-foreground">
                    Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos
                    a:
                  </p>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="font-semibold text-primary">📩 munassian@gmail.com</p>
                  </div>
                  <p className="text-muted-foreground">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">📲 Sobre el inicio de sesión</h2>
                  <p className="text-muted-foreground">
                    El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña
                    ni accedemos a otros datos de tu cuenta de Google.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">📍 Cambios en esta política</h2>
                  <p className="text-muted-foreground">
                    Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la
                    app o por correo electrónico.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary">📬 Contacto</h2>
                  <p className="text-muted-foreground">
                    Para cualquier duda o consulta sobre privacidad, escribinos a:
                  </p>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="font-semibold text-primary">📧 munassian@gmail.com</p>
                  </div>
                </div>

                <div className="text-center pt-6 border-t border-primary/10">
                  <p className="text-primary font-semibold">Gracias por usar Vaquitapp 💸🐮</p>
                  <p className="text-muted-foreground mt-2">
                    Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/10 text-center">
              <Button onClick={handleBack} className="bg-primary hover:bg-primary/90 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
