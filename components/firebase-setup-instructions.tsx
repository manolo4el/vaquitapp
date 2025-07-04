"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react"

export function FirebaseSetupInstructions() {
  const [copied, setCopied] = useState(false)

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso completo para usuarios autenticados (temporal para setup)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`

  const productionRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para usuarios - solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reglas para grupos - solo miembros pueden acceder
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.members;
      
      // Reglas para gastos dentro de grupos
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
    }
  }
}`

  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(firestoreRules)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying to clipboard:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Configuración de Firebase Requerida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error de permisos detectado.</strong> Necesitas configurar las reglas de seguridad de Firestore
              para que la aplicación funcione correctamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pasos para configurar Firebase:</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Ve a Firebase Console</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                    onClick={() =>
                      window.open("https://console.firebase.google.com/project/divisor-gastos-42acd", "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Firebase Console
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Ve a: Firestore Database → Rules</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Copia y pega estas reglas TEMPORALES (para empezar):</p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto border">
                      <code>{firestoreRules}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 bg-transparent"
                      onClick={copyRules}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Haz clic en "Publicar" para guardar las reglas</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <div>
                  <p className="font-medium">Recarga esta página para continuar</p>
                  <Button className="mt-2" onClick={() => window.location.reload()}>
                    Recargar página
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Importante:</strong> Estas son reglas temporales muy permisivas para que puedas empezar. Una vez
              que la app funcione, te recomendamos cambiar a reglas más seguras.
            </AlertDescription>
          </Alert>

          <details className="bg-muted/50 p-4 rounded-lg">
            <summary className="cursor-pointer font-medium">🔒 Ver reglas de producción (más seguras)</summary>
            <pre className="mt-2 text-sm overflow-x-auto">
              <code>{productionRules}</code>
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
