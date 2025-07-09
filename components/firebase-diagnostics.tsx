"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, AlertTriangle, ExternalLink, Users, Settings, Shield, Globe } from "lucide-react"

export function FirebaseDiagnostics() {
  const { user, authError } = useAuth()
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const diagnosticSteps = [
    {
      title: "1. Verificar métodos de autenticación habilitados",
      description: "Google debe estar habilitado como proveedor",
      action: () =>
        window.open(
          "https://console.firebase.google.com/project/divisor-gastos-42acd/authentication/providers",
          "_blank",
        ),
      buttonText: "Abrir Proveedores de Auth",
    },
    {
      title: "2. Verificar dominios autorizados",
      description: "Tu dominio de Vercel debe estar en la lista",
      action: () =>
        window.open(
          "https://console.firebase.google.com/project/divisor-gastos-42acd/authentication/settings",
          "_blank",
        ),
      buttonText: "Abrir Configuración de Auth",
    },
    {
      title: "3. Verificar usuarios registrados",
      description: "Ver si hay límites o restricciones",
      action: () =>
        window.open("https://console.firebase.google.com/project/divisor-gastos-42acd/authentication/users", "_blank"),
      buttonText: "Ver Usuarios",
    },
    {
      title: "4. Verificar reglas de Firestore",
      description: "Las reglas deben permitir múltiples usuarios",
      action: () =>
        window.open("https://console.firebase.google.com/project/divisor-gastos-42acd/firestore/rules", "_blank"),
      buttonText: "Ver Reglas de Firestore",
    },
  ]

  if (!showDiagnostics) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiagnostics(true)}
          className="bg-card/90 backdrop-blur-sm border-primary/20"
        >
          <Settings className="h-4 w-4 mr-2" />
          Diagnóstico Firebase
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Diagnóstico de Firebase Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado actual */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Estado Actual
            </h3>

            <div className="grid gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Usuario actual:</span>
                <Badge variant={user ? "default" : "secondary"}>{user ? user.email : "No autenticado"}</Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Error de auth:</span>
                <Badge variant={authError ? "destructive" : "default"}>{authError ? "Sí" : "No"}</Badge>
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{authError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Pasos de diagnóstico */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pasos de Verificación:</h3>

            {diagnosticSteps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                <Button variant="outline" size="sm" onClick={step.action} className="w-full bg-transparent">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  {step.buttonText}
                </Button>
              </div>
            ))}
          </div>

          {/* Configuraciones comunes */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuraciones que debes verificar:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  • <strong>Proveedores:</strong> Google debe estar habilitado
                </li>
                <li>
                  • <strong>Dominios autorizados:</strong> Incluir tu dominio de Vercel
                </li>
                <li>
                  • <strong>Modo de registro:</strong> Debe permitir nuevos usuarios
                </li>
                <li>
                  • <strong>Límites:</strong> No debe haber límites de usuarios
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Dominios que deben estar autorizados */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Dominios que deben estar autorizados:
            </h4>
            <div className="space-y-1">
              <code className="block text-xs bg-muted p-2 rounded">localhost</code>
              <code className="block text-xs bg-muted p-2 rounded">
                v0-gastos-2-0-git-fondo-marron-1-munassian-gmailcoms-projects.vercel.app
              </code>
              <code className="block text-xs bg-muted p-2 rounded">*.vercel.app</code>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDiagnostics(false)} className="flex-1">
              Cerrar
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Recargar App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
