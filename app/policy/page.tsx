"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">
              🛡️ Política de Privacidad – Vaquitapp
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Última actualización: Julio 2025</p>
          </CardHeader>

          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
              </p>

              <p>
                A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                usuario.
              </p>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-3">
                  📥 ¿Qué datos recopilamos?
                </h3>
                <p className="mb-3">
                  Al utilizar Vaquitapp, recopilamos únicamente la información necesaria para que la app funcione
                  correctamente:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
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

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  🔒 ¿Cómo protegemos tus datos?
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                  <li>La información está encriptada tanto en tránsito como en reposo.</li>
                  <li>No compartimos tu información con terceros.</li>
                  <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300 mb-3">
                  👤 ¿Quién tiene acceso a tus datos?
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo:
                    alias o gastos en común).
                  </li>
                  <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-3">
                  🧽 Eliminación de datos y cuenta
                </h3>
                <p className="mb-2">
                  Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos a:
                </p>
                <p className="font-semibold">📩 munassian@gmail.com</p>
                <p className="mt-2">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-300 mb-3">
                  📲 Sobre el inicio de sesión
                </h3>
                <p>
                  El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña
                  ni accedemos a otros datos de tu cuenta de Google.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                  📍 Cambios en esta política
                </h3>
                <p>
                  Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la app
                  o por correo electrónico.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-gray-500">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-3">📬 Contacto</h3>
                <p className="mb-2">Para cualquier duda o consulta sobre privacidad, escribinos a:</p>
                <p className="font-semibold">📧 munassian@gmail.com</p>
              </div>

              <div className="text-center py-6 border-t border-gray-200 dark:border-gray-600 mt-8">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Gracias por usar Vaquitapp 💸🐮
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
