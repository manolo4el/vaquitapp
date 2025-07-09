"use client"

import { useOfflineSync } from "@/hooks/use-offline-sync"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle } from "lucide-react"
import { useState } from "react"

export function SyncStatus() {
  const { isOnline, pendingActions, isSyncing, lastSyncTime, syncNow } = useOfflineSync()
  const [isExpanded, setIsExpanded] = useState(false)

  // No mostrar si está online y no hay acciones pendientes
  if (isOnline && pendingActions.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card
        className={`transition-all duration-300 ${!isOnline ? "border-orange-500 bg-orange-50" : "border-green-500 bg-green-50"}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-orange-600" />}

              <span className={`text-sm font-medium ${!isOnline ? "text-orange-800" : "text-green-800"}`}>
                {isOnline ? "En línea" : "Sin conexión"}
              </span>

              {pendingActions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingActions.length} pendiente{pendingActions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {pendingActions.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="h-6 w-6 p-0">
                  <Clock className="h-3 w-3" />
                </Button>
              )}

              {isOnline && pendingActions.length > 0 && (
                <Button size="sm" variant="ghost" onClick={syncNow} disabled={isSyncing} className="h-6 w-6 p-0">
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {isExpanded && pendingActions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-gray-600 font-medium">Acciones pendientes:</div>

              {pendingActions.slice(0, 3).map((action) => (
                <div key={action.id} className="flex items-center justify-between text-xs bg-white rounded p-2">
                  <div>
                    <span className="font-medium capitalize">{action.type}</span>
                    <span className="text-gray-500 ml-1">({action.method})</span>
                  </div>
                  <div className="text-gray-400">{new Date(action.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}

              {pendingActions.length > 3 && (
                <div className="text-xs text-gray-500 text-center">+{pendingActions.length - 3} más...</div>
              )}
            </div>
          )}

          {lastSyncTime && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3" />
              Última sync: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}

          {!isOnline && (
            <div className="mt-2 text-xs text-orange-700">Los cambios se sincronizarán cuando vuelva la conexión</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
