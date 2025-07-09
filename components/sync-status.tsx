"use client"

import { useState } from "react"
import { useOfflineSync } from "@/hooks/use-offline-sync"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

export function SyncStatus() {
  const { isOnline, isSyncing, pendingActions, lastSyncTime, triggerSync, clearPendingActions } = useOfflineSync()
  const [isExpanded, setIsExpanded] = useState(false)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "expenses":
        return "Gastos"
      case "groups":
        return "Grupos"
      case "users":
        return "Usuario"
      default:
        return type
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "POST":
        return "Crear"
      case "PUT":
        return "Actualizar"
      case "DELETE":
        return "Eliminar"
      default:
        return method
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              <span>{isOnline ? "En línea" : "Sin conexión"}</span>
            </div>
            {pendingActions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingActions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Estado de sincronización */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : lastSyncTime ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Última sync: {lastSyncTime.toLocaleTimeString("es-ES")}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>Sin sincronizar</span>
                </>
              )}
            </div>

            {/* Acciones pendientes */}
            {pendingActions.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs">
                        {pendingActions.length} acción{pendingActions.length !== 1 ? "es" : ""} pendiente
                        {pendingActions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {pendingActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="text-xs p-2 bg-muted rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{getMethodLabel(action.method)}</span>
                            <span className="text-muted-foreground ml-1">{getActionTypeLabel(action.type)}</span>
                          </div>
                          <span className="text-muted-foreground">{formatTime(action.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                    {pendingActions.length > 5 && (
                      <div className="text-xs text-center text-muted-foreground py-1">
                        +{pendingActions.length - 5} más...
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={triggerSync}
                disabled={!isOnline || isSyncing}
                className="flex-1 text-xs h-8 bg-transparent"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sincronizar
              </Button>

              {pendingActions.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearPendingActions}
                  className="text-xs h-8 px-2"
                  title="Limpiar acciones pendientes"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SyncStatus
