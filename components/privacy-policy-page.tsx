"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void
}

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate("login")}
            className="flex items-center space-x-2 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al login</span>
          </Button>

          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
              <Image
                src="/cow-logo.svg"
                alt="Vaquitapp"
                width={24}
                height={24}
                className="filter brightness-0 invert"
              />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vaquitapp
            </h1>
          </div>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🛡️ Política de Privacidad – Vaquitapp
            </CardTitle>
            <p className="text-sm text-muted-foreground">Última actualización: Julio 2025</p>
          </CardHeader>

          <CardContent className="space-y-6 text-sm leading-relaxed">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
              </p>

              <p className="text-muted-foreground">
                A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                usuario.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>📥</span>
                <span>¿Qué datos recopilamos?</span>
              </h3>
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
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>🔒</span>
                <span>¿Cómo protegemos tus datos?</span>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                <li>La información está encriptada tanto en tránsito como en reposo.</li>
                <li>No compartimos tu información con terceros.</li>
                <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>👤</span>
                <span>¿Quién tiene acceso a tus datos?</span>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo: alias
                  o gastos en común).
                </li>
                <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>🧽</span>
                <span>Eliminación de datos y cuenta</span>
              </h3>
              <p className="text-muted-foreground">
                Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos a:
              </p>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-primary font-medium">📩 munassian@gmail.com</p>
              </div>
              <p className="text-muted-foreground">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>📲</span>
                <span>Sobre el inicio de sesión</span>
              </h3>
              <p className="text-muted-foreground">
                El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña ni
                accedemos a otros datos de tu cuenta de Google.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>📍</span>
                <span>Cambios en esta política</span>
              </h3>
              <p className="text-muted-foreground">
                Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la app o
                por correo electrónico.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                <span>📬</span>
                <span>Contacto</span>
              </h3>
              <p className="text-muted-foreground">Para cualquier duda o consulta sobre privacidad, escribinos a:</p>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-primary font-medium">📧 munassian@gmail.com</p>
              </div>
            </div>

            <div className="text-center space-y-4 pt-6 border-t border-primary/20">
              <p className="text-primary font-medium">Gracias por usar Vaquitapp 💸🐮</p>
              <p className="text-muted-foreground text-xs">
                Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Button */}
        <div className="text-center mt-6">
          <Button
            onClick={() => onNavigate("login")}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al login
          </Button>
        </div>
      </div>
    </div>
  )
}
