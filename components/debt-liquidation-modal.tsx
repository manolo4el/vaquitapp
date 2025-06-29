"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Copy, Check, CreditCard, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { formatAmount } from "@/lib/expense-calculator"
import { markTransferAsCompleted } from "@/lib/group-storage"

interface DebtLiquidationModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  debtor: {
    id: string // Cambiar de number a string
    name: string
    avatar?: string
  }
  debts: Array<{
    creditor: {
      id: string // Cambiar de number a string
      name: string
      avatar?: string
      alias?: string
    }
    amount: number
  }>
  totalDebt: number
  onTransferMarked?: () => void
}

export default function DebtLiquidationModal({
  isOpen,
  onClose,
  groupId,
  debtor,
  debts,
  totalDebt,
  onTransferMarked,
}: DebtLiquidationModalProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [markedAsTransferred, setMarkedAsTransferred] = useState<{ [key: string]: boolean }>({})
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({})

  if (!isOpen) return null

  const handleCopyAlias = async (creditorId: string, alias: string) => {
    try {
      await navigator.clipboard.writeText(alias)
      setCopiedStates((prev) => ({ ...prev, [creditorId]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [creditorId]: false }))
      }, 2000)
    } catch (error) {
      console.error("Error al copiar:", error)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = alias
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedStates((prev) => ({ ...prev, [creditorId]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [creditorId]: false }))
      }, 2000)
    }
  }

  const handleMarkAsTransferred = async (creditorId: string, amount: number) => {
    setIsProcessing((prev) => ({ ...prev, [creditorId]: true }))

    try {
      // Simular delay de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Marcar transferencia como completada
      markTransferAsCompleted(groupId, debtor.id, creditorId, amount)

      setMarkedAsTransferred((prev) => ({ ...prev, [creditorId]: true }))
      console.log("Transferencia marcada como completada:", { from: debtor.id, to: creditorId, amount })

      // Notificar al componente padre para actualizar los datos
      if (onTransferMarked) {
        onTransferMarked()
      }

      // Ocultar el estado después de un momento
      setTimeout(() => {
        setMarkedAsTransferred((prev) => ({ ...prev, [creditorId]: false }))
      }, 2000)
    } catch (error) {
      console.error("Error al marcar transferencia:", error)
    } finally {
      setIsProcessing((prev) => ({ ...prev, [creditorId]: false }))
    }
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
      <Card className="bg-white border-0 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="relative sticky top-0 bg-white border-b z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-2 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="text-center pt-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={debtor.avatar || "/placeholder.svg"} alt={debtor.name} />
                <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white">
                  {debtor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">Liquidar Deudas</CardTitle>
                <p className="text-gray-600 text-sm">{debtor.name}</p>
              </div>
            </div>

            {/* Total de deuda */}
            <div className="bg-coral-50 border border-coral-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-coral-700 mb-1">Total a transferir</p>
              <p className="text-3xl font-bold text-coral-800">{formatAmount(totalDebt)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Lista de deudas individuales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
              Detalle de transferencias ({debts.length})
            </h3>

            {debts.map((debt, index) => (
              <Card key={debt.creditor.id} className="bg-gray-50 border border-gray-200">
                <CardContent className="p-4">
                  {/* Header de la deuda */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-coral-100 p-2 rounded-full">
                        <span className="text-coral-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={debt.creditor.avatar || "/placeholder.svg"} alt={debt.creditor.name} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-coral-400 text-white text-sm">
                          {debt.creditor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">{debt.creditor.name}</p>
                        <p className="text-sm text-gray-500">Transferir a esta persona</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-coral-600">{formatAmount(debt.amount)}</p>
                    </div>
                  </div>

                  {/* Información bancaria */}
                  {debt.creditor.alias ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Alias/CBU/CVU:</p>
                      </div>

                      <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-3">
                        <p className="font-mono text-base text-blue-800 text-center break-all">
                          {formatAlias(debt.creditor.alias)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleCopyAlias(debt.creditor.id, debt.creditor.alias!)}
                          variant="outline"
                          className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          {copiedStates[debt.creditor.id] ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              <span className="text-green-600">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleMarkAsTransferred(debt.creditor.id, debt.amount)}
                          disabled={markedAsTransferred[debt.creditor.id] || isProcessing[debt.creditor.id]}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                        >
                          {isProcessing[debt.creditor.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Procesando...</span>
                            </div>
                          ) : markedAsTransferred[debt.creditor.id] ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              ¡Transferido!
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar transferido
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-yellow-800 text-sm">
                          <strong>{debt.creditor.name}</strong> aún no ha configurado su alias/CBU en su perfil. Pídele
                          que complete esta información para poder transferirle.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instrucciones generales */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 text-sm mb-2">💡 Instrucciones:</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Copia cada alias/CBU individualmente</li>
              <li>• Realiza las transferencias por los montos exactos</li>
              <li>• Marca como transferido después de cada pago</li>
              <li>• Los saldos se actualizarán automáticamente</li>
            </ul>
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
