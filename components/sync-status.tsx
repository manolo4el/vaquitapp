"use client"

import { useOfflineSync } from "@/hooks/use-offline-sync"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, Clock } from "lucide-react"

export function SyncStatus() {
  const { isOnline, pendingActions, syncInProgress, triggerBackgroundSync } = useOfflineSync()

  if (isOnline && pendingActions.length === 0) {
    return null // No mostrar nada cuando todo está sincronizado
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-medium">{isOnline ? "En línea" : "Sin conexión"}</span>
          {syncInProgress && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
        </div>

        {pendingActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                {pendingActions.length} acción{pendingActions.length !== 1 ? "es" : ""} pendiente
                {pendingActions.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {pendingActions.map((action) => (
                <Badge key={action.id} variant="secondary" className="text-xs">
                  {action.type}
                </Badge>
              ))}
            </div>

            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={triggerBackgroundSync}
                disabled={syncInProgress}
                className="w-full bg-transparent"
              >
                {syncInProgress ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sincronizar ahora
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
