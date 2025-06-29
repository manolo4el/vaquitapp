"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Copy, Check, Share2, Users } from "lucide-react"
import { useState } from "react"

interface ShareGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    id: string
    name: string
    inviteCode: string
    memberCount: number
  }
}

export default function ShareGroupModal({ isOpen, onClose, group }: ShareGroupModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const inviteUrl = `${window.location.origin}/invite/${group.inviteCode}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error al copiar:", error)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = inviteUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al grupo "${group.name}"`,
          text: `Te invito a unirte a nuestro grupo de gastos compartidos`,
          url: inviteUrl,
        })
      } catch (error) {
        console.error("Error al compartir:", error)
      }
    } else {
      // Fallback: copiar link
      handleCopyLink()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-white border-0 shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-2 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="text-center pt-4">
            <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Share2 className="w-6 h-6 text-lime-600" />
            </div>
            <CardTitle className="text-xl">Compartir Grupo</CardTitle>
            <p className="text-gray-600 text-sm mt-2">Invita más personas a "{group.name}"</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del grupo */}
          <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-lime-600" />
              <span className="font-medium text-lime-800">{group.name}</span>
            </div>
            <p className="text-sm text-lime-700">{group.memberCount} miembros actuales</p>
          </div>

          {/* Link de invitación */}
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">Comparte este link para que se unan automáticamente al grupo:</p>

            {/* Cuadro del link */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-800 truncate">{inviteUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">Código: {group.inviteCode}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopyLink}
                className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar link
                  </>
                )}
              </Button>

              <Button onClick={handleShareLink} variant="outline" className="flex-1 bg-white/50 hover:bg-white/80">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-1 rounded-full flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800 text-sm">¿Cómo funciona?</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Cualquier persona que abra este link se unirá automáticamente al grupo y podrá ver y agregar gastos.
                </p>
              </div>
            </div>
          </div>

          {/* Botón cerrar */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full bg-white hover:bg-gray-50 py-3 text-base font-medium"
          >
            Cerrar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
