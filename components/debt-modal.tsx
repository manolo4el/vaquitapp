"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Copy, Check, CreditCard, ArrowRight, CheckCircle } from "lucide-react"
import { useState } from "react"
import { formatAmount } from "@/lib/expense-calculator"

interface DebtModalProps {
  isOpen: boolean
  onClose: () => void
  debt: {
    amount: number
    creditor: {
      id: number
      name: string
      avatar?: string
      alias?: string
    }
  }
}

export default function DebtModal({ isOpen, onClose, debt }: DebtModalProps) {
  const [copied, setCopied] = useState(false)
  const [isMarked, setIsMarked] = useState(false)

  if (!isOpen) return null

  const handleCopyAlias = async () => {
    if (!debt.creditor.alias) return

    try {
      await navigator.clipboard.writeText(debt.creditor.alias)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error al copiar:", error)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = debt.creditor.alias
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleMarkAsTransferred = () => {
    // TODO: Implementar lógica de marcar como transferido
    setIsMarked(true)
    console.log("Marcando como transferido:", debt)

    // Simular confirmación y cerrar modal después de un momento
    setTimeout(() => {
      onClose()
      setIsMarked(false)
    }, 1500)
  }

  const formatAlias = (alias: string) => {
    // Si es un CBU/CVU (22 dígitos), formatearlo con espacios
    if (/^\d{22}$/.test(alias)) {
      return alias.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, "$1 $2 $3 $4 $5 $6")
    }
    return alias
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
            <div className="bg-coral-100 p-3 rounded-full w-fit mx-auto mb-4">
              <ArrowRight className="w-6 h-6 text-coral-600" />
            </div>
            <CardTitle className="text-xl">Transferir Dinero</CardTitle>
            <p className="text-gray-600 text-sm mt-2">Información para realizar el pago</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Monto de la deuda */}
          <div className="text-center bg-coral-50 border border-coral-200 rounded-lg p-4">
            <p className="text-sm text-coral-700 mb-1">Monto a transferir</p>
            <p className="text-3xl font-bold text-coral-800">{formatAmount(debt.amount)}</p>
          </div>

          {/* Información del destinatario */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={debt.creditor.avatar || "/placeholder.svg"} alt={debt.creditor.name} />
                <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white">
                  {debt.creditor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Transferir a:</p>
                <p className="text-lg font-semibold text-gray-900">{debt.creditor.name}</p>
              </div>
            </div>

            {/* Alias/CBU/CVU */}
            {debt.creditor.alias ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-700">Alias/CBU/CVU:</p>
                </div>

                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4">
                  <p className="font-mono text-lg text-blue-800 text-center break-all">
                    {formatAlias(debt.creditor.alias)}
                  </p>
                </div>

                <Button
                  onClick={handleCopyAlias}
                  variant="outline"
                  className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-green-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar alias/CBU
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>{debt.creditor.name}</strong> aún no ha configurado su alias/CBU en su perfil.
                </p>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 text-sm">
              <strong>Pasos a seguir:</strong>
              <br />
              1. Copia el alias/CBU de arriba
              <br />
              2. Abre tu app bancaria o billetera digital
              <br />
              3. Realiza la transferencia por {formatAmount(debt.amount)}
              <br />
              4. Vuelve aquí y marca como transferido
            </p>
          </div>

          {/* Botón marcar como transferido */}
          <Button
            onClick={handleMarkAsTransferred}
            disabled={isMarked}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6 text-lg font-medium"
          >
            {isMarked ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>¡Marcado como transferido!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Marcar como transferido</span>
              </div>
            )}
          </Button>

          {/* Nota legal */}
          <p className="text-xs text-gray-500 text-center">
            Al marcar como transferido, notificarás al grupo que realizaste el pago. Asegúrate de haber completado la
            transferencia antes de confirmar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
