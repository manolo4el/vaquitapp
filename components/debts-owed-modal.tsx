"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, TrendingUp, Users, Eye } from "lucide-react"
import { formatAmount } from "@/lib/expense-calculator"

interface DebtDetail {
  groupId: string
  groupName: string
  debtor: {
    id: string
    name: string
    avatar?: string
  }
  amount: number
}

interface DebtsOwedModalProps {
  isOpen: boolean
  onClose: () => void
  debts: DebtDetail[]
  totalOwed: number
  onViewGroup: (groupId: string) => void
}

export default function DebtsOwedModal({ isOpen, onClose, debts, totalOwed, onViewGroup }: DebtsOwedModalProps) {
  if (!isOpen) return null

  // Agrupar deudas por deudor
  const debtsByDebtor = debts.reduce((acc, debt) => {
    const debtorId = debt.debtor.id
    if (!acc[debtorId]) {
      acc[debtorId] = {
        debtor: debt.debtor,
        totalAmount: 0,
        groups: [],
      }
    }
    acc[debtorId].totalAmount += debt.amount
    acc[debtorId].groups.push({
      groupId: debt.groupId,
      groupName: debt.groupName,
      amount: debt.amount,
    })
    return acc
  }, {} as any)

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
            <div className="bg-lime-100 p-3 rounded-full w-fit mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-lime-600" />
            </div>
            <CardTitle className="text-xl">Te Deben Dinero</CardTitle>
            <p className="text-gray-600 text-sm mt-2">Resumen de lo que te deben por grupo</p>
          </div>

          {/* Total */}
          <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-lime-700 mb-1">Total que te deben</p>
            <p className="text-3xl font-bold text-lime-800">{formatAmount(totalOwed)}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {Object.entries(debtsByDebtor).map(([debtorId, debtorInfo]: [string, any]) => (
            <Card key={debtorId} className="bg-lime-50 border-lime-200">
              <CardContent className="p-4">
                {/* Header del deudor */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={debtorInfo.debtor.avatar || "/placeholder.svg"} alt={debtorInfo.debtor.name} />
                      <AvatarFallback className="bg-gradient-to-r from-lime-400 to-violet-400 text-white text-sm">
                        {debtorInfo.debtor.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">{debtorInfo.debtor.name}</p>
                      <p className="text-sm text-gray-500">
                        Te debe en {debtorInfo.groups.length} grupo{debtorInfo.groups.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-lime-600">{formatAmount(debtorInfo.totalAmount)}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>

                {/* Detalle por grupo */}
                <div className="space-y-2">
                  {debtorInfo.groups.map((group: any) => (
                    <div
                      key={group.groupId}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-lime-200"
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">{group.groupName}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-lime-600">{formatAmount(group.amount)}</span>
                        <Button
                          onClick={() => onViewGroup(group.groupId)}
                          size="sm"
                          variant="outline"
                          className="bg-lime-50 hover:bg-lime-100 border-lime-300"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver grupo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              <strong>💡 Tip:</strong> Puedes recordarles a estas personas que te deben dinero enviándoles el link del
              grupo correspondiente.
            </p>
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
