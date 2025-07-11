import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-primary">Política de Privacidad</h1>
        </div>

        {/* Contenido de las políticas */}
        <Card className="shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🛡️ Política de Privacidad – Vaquitapp
            </CardTitle>
            <p className="text-muted-foreground">Última actualización: Julio 2025</p>
          </CardHeader>

          <CardContent className="prose prose-slate max-w-none space-y-6">
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

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">📥 ¿Qué datos recopilamos?</h2>
                <p className="text-muted-foreground mb-3">
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
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">🔒 ¿Cómo protegemos tus datos?</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Todos los datos se almacenan de forma segura en Firebase (Google).</li>
                  <li>La información está encriptada tanto en tránsito como en reposo.</li>
                  <li>No compartimos tu información con terceros.</li>
                  <li>No utilizamos tus datos con fines publicitarios o comerciales.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">👤 ¿Quién tiene acceso a tus datos?</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Solo vos y los usuarios con quienes compartís grupos pueden ver cierta información (por ejemplo:
                    alias o gastos en común).
                  </li>
                  <li>Tu información personal no se comparte ni se vende bajo ninguna circunstancia.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">🧽 Eliminación de datos y cuenta</h2>
                <p className="text-muted-foreground mb-2">
                  Si querés eliminar tu cuenta y todos los datos asociados (grupos, gastos, alias, etc.), escribinos a:
                </p>
                <p className="text-primary font-medium">
                  📩{" "}
                  <a href="mailto:munassian@gmail.com" className="hover:underline">
                    munassian@gmail.com
                  </a>
                </p>
                <p className="text-muted-foreground">Procesaremos la solicitud dentro de los 5 días hábiles.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">📲 Sobre el inicio de sesión</h2>
                <p className="text-muted-foreground">
                  El único método para acceder a Vaquitapp es a través de Google Sign-In. No almacenamos tu contraseña
                  ni accedemos a otros datos de tu cuenta de Google.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">📍 Cambios en esta política</h2>
                <p className="text-muted-foreground">
                  Si realizamos cambios importantes en esta Política de Privacidad, te lo vamos a comunicar desde la app
                  o por correo electrónico.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">📬 Contacto</h2>
                <p className="text-muted-foreground mb-2">
                  Para cualquier duda o consulta sobre privacidad, escribinos a:
                </p>
                <p className="text-primary font-medium">
                  📧{" "}
                  <a href="mailto:munassian@gmail.com" className="hover:underline">
                    munassian@gmail.com
                  </a>
                </p>
              </section>

              <section className="text-center pt-6 border-t border-primary/20">
                <h2 className="text-xl font-semibold text-primary mb-3">Gracias por usar Vaquitapp 💸🐮</h2>
                <p className="text-muted-foreground">
                  Hacemos lo posible para que organizar gastos entre amigos sea cada vez más fácil y seguro.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
