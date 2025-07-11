import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad - Vaquitapp",
  description: "Política de privacidad de Vaquitapp - Aplicación para organizar gastos entre amigos",
}

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center space-x-2 text-green-600 hover:bg-green-100">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la app</span>
            </Button>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
              <Image
                src="/cow-logo.svg"
                alt="Vaquitapp"
                width={24}
                height={24}
                className="filter brightness-0 invert"
              />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Vaquitapp
            </h1>
          </div>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🛡️ Política de Privacidad – Vaquitapp
            </CardTitle>
            <p className="text-sm text-gray-600">Última actualización: Julio 2025</p>
          </CardHeader>

          <CardContent className="space-y-8 text-sm leading-relaxed max-w-none">
            <div className="space-y-4">
              <p className="text-gray-700 text-base">
                En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
              </p>

              <p className="text-gray-700 text-base">
                A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                usuario.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>📥</span>
                <span>¿Qué datos recopilamos?</span>
              </h3>
              <p className="text-gray-700">
                Al utilizar Vaquitapp, recopilamos únicamente la información necesaria para que la app funcione
                correctamente:
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
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

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>🔒</span>
                <span>¿Cómo protegemos tus datos?</span>
              </h3>
              <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
                <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                <li>La información está encriptada tanto en tránsito como en reposo.</li>
                <li>No compartimos tu información con terceros.</li>
                <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>👤</span>
                <span>¿Quién tiene acceso a tus datos?</span>
              </h3>
              <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
                <li>
                  Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo: alias
                  o gastos en común).
                </li>
                <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>🧽</span>
                <span>Eliminación de datos y cuenta</span>
              </h3>
              <p className="text-gray-700">
                Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos a:
              </p>
              <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-green-700 font-medium text-lg">📩 munassian@gmail.com</p>
              </div>
              <p className="text-gray-700">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>📲</span>
                <span>Sobre el inicio de sesión</span>
              </h3>
              <p className="text-gray-700">
                El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña ni
                accedemos a otros datos de tu cuenta de Google.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>📍</span>
                <span>Cambios en esta política</span>
              </h3>
              <p className="text-gray-700">
                Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la app o
                por correo electrónico.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600 flex items-center space-x-2">
                <span>📬</span>
                <span>Contacto</span>
              </h3>
              <p className="text-gray-700">Para cualquier duda o consulta sobre privacidad, escribinos a:</p>
              <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-green-700 font-medium text-lg">📧 munassian@gmail.com</p>
              </div>
            </div>

            <div className="text-center space-y-6 pt-8 border-t border-green-200">
              <p className="text-green-600 font-medium text-lg">Gracias por usar Vaquitapp 💸🐮</p>
              <p className="text-gray-600">
                Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link href="/">
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              <Home className="h-4 w-4 mr-2" />
              Ir a la app
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pb-8">
          <p className="text-gray-500 text-sm">© 2025 Vaquitapp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
