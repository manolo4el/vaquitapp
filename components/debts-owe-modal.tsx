"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, TrendingDown, Users, CreditCard, Copy, Check, CheckCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { formatAmount } from "@/lib/expense-calculator"
import { markMultiGroupTransferAsCompleted } from "@/lib/group-storage"

interface DebtDetail {
  groupId: string
  groupName: string
  creditor: {
    id: string
    name: string
    avatar?: string
    alias?: string
  }
  amount: number
}

interface DebtsOweModalProps {
  isOpen: boolean
  onClose: () => void
  debts: DebtDetail[]
  totalOwed: number
  onTransferMarked?: () => void
}

export default function DebtsOweModal({ isOpen, onClose, debts, totalOwed, onTransferMarked }: DebtsOweModalProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [markedAsTransferred, setMarkedAsTransferred] = useState<{ [key: string]: boolean }>({})
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({})

  if (!isOpen) return null

  // Agrupar deudas por acreedor
  const debtsByCreditor = debts.reduce((acc, debt) => {
    const creditorId = debt.creditor.id
    if (!acc[creditorId]) {
      acc[creditorId] = {
        creditor: debt.creditor,
        totalAmount: 0,
        groups: [],
      }
    }
    acc[creditorId].totalAmount += debt.amount
    acc[creditorId].groups.push({
      groupId: debt.groupId,
      groupName: debt.groupName,
      amount: debt.amount,
    })
    return acc
  }, {} as any)

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

  const handleMarkAsTransferred = async (creditorId: string, creditorInfo: any) => {
    setIsProcessing((prev) => ({ ...prev, [creditorId]: true }))

    try {
      // Simular delay de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Marcar transferencias en todos los grupos afectados
      const groupIds = creditorInfo.groups.map((g: any) => g.groupId)
      const amounts = creditorInfo.groups.map((g: any) => g.amount)

      await markMultiGroupTransferAsCompleted(groupIds, creditorId, amounts)

      setMarkedAsTransferred((prev) => ({ ...prev, [creditorId]: true }))
      console.log("Transferencias consolidadas marcadas como completadas:", {
        creditor: creditorId,
        groups: groupIds,
        totalAmount: creditorInfo.totalAmount,
      })

      // Notificar al componente padre para actualizar los datos
      if (onTransferMarked) {
        onTransferMarked()
      }

      // Ocultar el estado después de un momento
      setTimeout(() => {
        setMarkedAsTransferred((prev) => ({ ...prev, [creditorId]: false }))
      }, 2000)
    } catch (error) {
      console.error("Error al marcar transferencias:", error)
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
            <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Deudas Pendientes</CardTitle>
            <p className="text-gray-600 text-sm mt-2">Resumen consolidado de lo que debes</p>
          </div>

          {/* Total */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700 mb-1">Total que debes</p>
            <p className="text-3xl font-bold text-orange-800">{formatAmount(totalOwed)}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {Object.entries(debtsByCreditor).map(([creditorId, creditorInfo]: [string, any]) => (
            <Card key={creditorId} className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                {/* Header del acreedor */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={creditorInfo.creditor.avatar || "/placeholder.svg"}
                        alt={creditorInfo.creditor.name}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-violet-400 text-white text-sm">
                        {creditorInfo.creditor.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">{creditorInfo.creditor.name}</p>
                      <p className="text-sm text-gray-500">
                        Le debes en {creditorInfo.groups.length} grupo{creditorInfo.groups.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-600">{formatAmount(creditorInfo.totalAmount)}</p>
                    <p className="text-sm text-gray-500">Total consolidado</p>
                  </div>
                </div>

                {/* Detalle por grupo */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">Detalle por grupo:</p>
                  {creditorInfo.groups.map((group: any) => (
                    <div
                      key={group.groupId}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200"
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">{group.groupName}</span>
                      </div>
                      <span className="font-semibold text-orange-600">{formatAmount(group.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Información bancaria */}
                {creditorInfo.creditor.alias ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">Alias/CBU/CVU:</p>
                    </div>

                    <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-3">
                      <p className="font-mono text-base text-blue-800 text-center break-all">
                        {formatAlias(creditorInfo.creditor.alias)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleCopyAlias(creditorId, creditorInfo.creditor.alias!)}
                        variant="outline"
                        className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        {copiedStates[creditorId] ? (
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
                        onClick={() => handleMarkAsTransferred(creditorId, creditorInfo)}
                        disabled={markedAsTransferred[creditorId] || isProcessing[creditorId]}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                      >
                        {isProcessing[creditorId] ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Procesando...</span>
                          </div>
                        ) : markedAsTransferred[creditorId] ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            ¡Transferido!
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Liquidar total
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Nota sobre liquidación consolidada */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-emerald-700 text-sm">
                        <strong>💡 Liquidación consolidada:</strong> Al marcar como transferido, se actualizarán
                        automáticamente todos los grupos donde le debes a {creditorInfo.creditor.name}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-800 text-sm">
                        <strong>{creditorInfo.creditor.name}</strong> aún no ha configurado su alias/CBU en su perfil.
                        Pídele que complete esta información para poder transferirle.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Instrucciones generales */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 text-sm mb-2">💡 Instrucciones:</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Las deudas están consolidadas por persona</li>
              <li>• Al liquidar, se actualizan todos los grupos automáticamente</li>
              <li>• Transfiere el monto total consolidado</li>
              <li>• Los saldos se recalcularán en tiempo real</li>
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
