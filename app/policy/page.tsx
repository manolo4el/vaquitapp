import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="prose prose-green max-w-none">
              <h1 className="text-3xl font-bold text-green-700 mb-6">🛡️ Política de Privacidad – Vaquitapp</h1>

              <p className="text-gray-600 mb-8">
                <strong>Última actualización:</strong> Julio 2025
              </p>

              <div className="space-y-8">
                <section>
                  <p className="text-lg leading-relaxed">
                    En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                    facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
                  </p>
                  <p className="text-lg leading-relaxed">
                    A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                    usuario.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">📥 ¿Qué datos recopilamos?</h2>
                  <p className="mb-4">
                    Al utilizar Vaquitapp, recopilamos únicamente la información necesaria para que la app funcione
                    correctamente:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
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
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">🔒 ¿Cómo protegemos tus datos?</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                    <li>La información está encriptada tanto en tránsito como en reposo.</li>
                    <li>No compartimos tu información con terceros.</li>
                    <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">👤 ¿Quién tiene acceso a tus datos?</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo:
                      alias o gastos en común).
                    </li>
                    <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">🧽 Eliminación de datos y cuenta</h2>
                  <p className="mb-4">
                    Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos
                    a:
                  </p>
                  <p className="mb-4">
                    📩{" "}
                    <a href="mailto:munassian@gmail.com" className="text-green-600 hover:text-green-700 underline">
                      munassian@gmail.com
                    </a>
                  </p>
                  <p>Procesaremos la solicitud dentro de los 5 días hábiles.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">📲 Sobre el inicio de sesión</h2>
                  <p>
                    El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña
                    ni accedemos a otros datos de tu cuenta de Google.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">📍 Cambios en esta política</h2>
                  <p>
                    Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la
                    app o por correo electrónico.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">📬 Contacto</h2>
                  <p className="mb-4">Para cualquier duda o consulta sobre privacidad, escribinos a:</p>
                  <p className="mb-8">
                    📧{" "}
                    <a href="mailto:munassian@gmail.com" className="text-green-600 hover:text-green-700 underline">
                      munassian@gmail.com
                    </a>
                  </p>
                </section>

                <section className="border-t pt-8">
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">Gracias por usar Vaquitapp 💸🐮</h2>
                  <p className="text-lg">
                    Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
                  </p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
