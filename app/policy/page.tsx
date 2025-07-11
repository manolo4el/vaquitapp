import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Contenido principal */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              🛡️ Política de Privacidad – Vaquitapp
            </CardTitle>
            <p className="text-muted-foreground mt-2">Última actualización: Julio 2025</p>
          </CardHeader>

          <CardContent className="prose prose-lg max-w-none space-y-6">
            <div className="text-gray-700 leading-relaxed">
              <p className="text-lg mb-6">
                En Vaquitapp, tu privacidad es muy importante. Esta aplicación fue desarrollada con el objetivo de
                facilitar la organización de gastos entre amigos de forma simple, segura y colaborativa.
              </p>

              <p className="mb-8">
                A continuación, te contamos qué datos recopilamos, cómo los usamos y cuáles son tus derechos como
                usuario.
              </p>

              {/* Sección: Qué datos recopilamos */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  📥 ¿Qué datos recopilamos?
                </h2>
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
              </div>

              {/* Sección: Cómo protegemos tus datos */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  🔒 ¿Cómo protegemos tus datos?
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                  <li>La información está encriptada tanto en tránsito como en reposo.</li>
                  <li>No compartimos tu información con terceros.</li>
                  <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
                </ul>
              </div>

              {/* Sección: Quién tiene acceso */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  👤 ¿Quién tiene acceso a tus datos?
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo:
                    alias o gastos en común).
                  </li>
                  <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
                </ul>
              </div>

              {/* Sección: Eliminación de datos */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  🧽 Eliminación de datos y cuenta
                </h2>
                <p className="mb-4">
                  Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos a:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold flex items-center gap-2">
                    📩{" "}
                    <a href="mailto:munassian@gmail.com" className="text-primary hover:underline">
                      munassian@gmail.com
                    </a>
                  </p>
                </div>
                <p className="mt-4">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
              </div>

              {/* Sección: Inicio de sesión */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  📲 Sobre el inicio de sesión
                </h2>
                <p>
                  El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña
                  ni accedemos a otros datos de tu cuenta de Google.
                </p>
              </div>

              {/* Sección: Cambios en la política */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                  📍 Cambios en esta política
                </h2>
                <p>
                  Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la app
                  o por correo electrónico.
                </p>
              </div>

              {/* Sección: Contacto */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">📬 Contacto</h2>
                <p className="mb-4">Para cualquier duda o consulta sobre privacidad, escribinos a:</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold flex items-center gap-2">
                    📧{" "}
                    <a href="mailto:munassian@gmail.com" className="text-primary hover:underline">
                      munassian@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-border">
                <p className="text-lg font-semibold text-primary mb-2">Gracias por usar Vaquitapp 💸🐮</p>
                <p className="text-muted-foreground">
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
