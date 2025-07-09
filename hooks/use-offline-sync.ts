"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface PendingAction {
  id: string
  type: "expenses" | "groups" | "users"
  method: "POST" | "PUT" | "DELETE"
  data: any
  timestamp: number
}

interface SyncStatus {
  isOnline: boolean
  pendingActions: PendingAction[]
  isSyncing: boolean
  lastSyncTime: Date | null
}

export function useOfflineSync() {
  const { toast } = useToast()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingActions: [],
    isSyncing: false,
    lastSyncTime: null,
  })

  // Inicializar IndexedDB
  const initDB = useCallback(async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("VaquitappOfflineDB", 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains("pendingActions")) {
          const store = db.createObjectStore("pendingActions", { keyPath: "id" })
          store.createIndex("type", "type", { unique: false })
        }
      }
    })
  }, [])

  // Agregar acción pendiente
  const addPendingAction = useCallback(
    async (action: Omit<PendingAction, "id" | "timestamp">) => {
      try {
        const db = await initDB()
        const pendingAction: PendingAction = {
          ...action,
          id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        }

        const transaction = db.transaction(["pendingActions"], "readwrite")
        const store = transaction.objectStore("pendingActions")
        await store.add(pendingAction)

        // Actualizar estado local
        setSyncStatus((prev) => ({
          ...prev,
          pendingActions: [...prev.pendingActions, pendingAction],
        }))

        // Registrar background sync si está disponible
        if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready
          await registration.sync.register(`${action.type}-sync`)
        }

        toast({
          title: "Acción guardada",
          description: "Se sincronizará cuando vuelvas a estar online",
        })

        return pendingAction.id
      } catch (error) {
        console.error("Error adding pending action:", error)
        toast({
          title: "Error",
          description: "No se pudo guardar la acción offline",
          variant: "destructive",
        })
        throw error
      }
    },
    [initDB, toast],
  )

  // Obtener acciones pendientes
  const getPendingActions = useCallback(async () => {
    try {
      const db = await initDB()
      const transaction = db.transaction(["pendingActions"], "readonly")
      const store = transaction.objectStore("pendingActions")

      return new Promise<PendingAction[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Error getting pending actions:", error)
      return []
    }
  }, [initDB])

  // Sincronizar manualmente
  const syncNow = useCallback(async () => {
    if (!syncStatus.isOnline) {
      console.log("Cannot sync while offline")
      toast({
        title: "Sin conexión",
        description: "No se puede sincronizar mientras estás offline",
        variant: "destructive",
      })
      return
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true }))

    try {
      const pendingActions = await getPendingActions()

      for (const action of pendingActions) {
        try {
          let endpoint = ""
          switch (action.type) {
            case "expenses":
              endpoint = "/api/expenses"
              break
            case "groups":
              endpoint = "/api/groups"
              break
            case "users":
              endpoint = "/api/users"
              break
          }

          const response = await fetch(endpoint, {
            method: action.method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(action.data),
          })

          if (response.ok) {
            // Eliminar acción exitosa
            const db = await initDB()
            const transaction = db.transaction(["pendingActions"], "readwrite")
            const store = transaction.objectStore("pendingActions")
            await store.delete(action.id)
          }
        } catch (error) {
          console.error("Error syncing action:", action.id, error)
        }
      }

      // Actualizar estado
      const remainingActions = await getPendingActions()
      setSyncStatus((prev) => ({
        ...prev,
        pendingActions: remainingActions,
        isSyncing: false,
        lastSyncTime: new Date(),
      }))

      toast({
        title: "Sincronización completada",
        description: "Todas las acciones pendientes se han sincronizado correctamente",
      })
    } catch (error) {
      console.error("Error during manual sync:", error)
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }))
      toast({
        title: "Error",
        description: "Hubo un error durante la sincronización",
        variant: "destructive",
      })
    }
  }, [syncStatus.isOnline, getPendingActions, initDB, toast])

  // Efectos
  useEffect(() => {
    // Cargar acciones pendientes al inicializar
    getPendingActions().then((actions) => {
      setSyncStatus((prev) => ({ ...prev, pendingActions: actions }))
    })

    // Escuchar cambios de conectividad
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }))
      // Intentar sincronizar automáticamente cuando vuelve la conexión
      setTimeout(syncNow, 1000)
    }

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }))
      toast({
        title: "Sin conexión",
        description: "Los cambios se guardarán y sincronizarán cuando vuelvas a estar online",
        variant: "destructive",
      })
    }

    // Escuchar mensajes del service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        console.log("Sync completed:", event.data.data)
        getPendingActions().then((actions) => {
          setSyncStatus((prev) => ({
            ...prev,
            pendingActions: actions,
            lastSyncTime: new Date(),
          }))
        })
        toast({
          title: "Sincronización completada",
          description: "Todas las acciones pendientes se han sincronizado correctamente",
        })
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    navigator.serviceWorker?.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      navigator.serviceWorker?.removeEventListener("message", handleMessage)
    }
  }, [getPendingActions, syncNow, toast])

  return {
    ...syncStatus,
    addPendingAction,
    syncNow,
    getPendingActions,
  }
}
