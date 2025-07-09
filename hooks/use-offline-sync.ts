"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface PendingAction {
  id: string
  type: "expenses" | "groups" | "users"
  method: "POST" | "PUT" | "DELETE"
  data: any
  timestamp: number
  retryCount: number
}

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingActions: PendingAction[]
  lastSyncTime: Date | null
}

export function useOfflineSync() {
  const { toast } = useToast()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingActions: [],
    lastSyncTime: null,
  })

  // Actualizar estado online/offline
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }))
      // Intentar sincronizar automáticamente cuando vuelve la conexión
      triggerSync()
    }

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Escuchar mensajes del service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_COMPLETE") {
          setSyncStatus((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: new Date(),
          }))
          // Actualizar lista de acciones pendientes
          loadPendingActions()
        }
      })
    }
  }, [])

  // Cargar acciones pendientes al inicializar
  useEffect(() => {
    loadPendingActions()
  }, [])

  // Función para cargar acciones pendientes desde IndexedDB
  const loadPendingActions = useCallback(async () => {
    try {
      const actions = await getAllPendingActions()
      setSyncStatus((prev) => ({ ...prev, pendingActions: actions }))
    } catch (error) {
      console.error("Error loading pending actions:", error)
    }
  }, [])

  // Función para agregar una acción pendiente
  const addPendingAction = useCallback(
    async (type: "expenses" | "groups" | "users", method: "POST" | "PUT" | "DELETE", data: any) => {
      const action: PendingAction = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        method,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      }

      try {
        await storePendingAction(action)
        await loadPendingActions()

        // Mostrar notificación solo si está offline
        if (!syncStatus.isOnline) {
          toast({
            title: "Sin conexión",
            description: "Los cambios se guardarán y sincronizarán automáticamente cuando vuelvas a estar online",
            variant: "default",
          })
        }

        // Si estamos online, intentar sincronizar inmediatamente
        if (syncStatus.isOnline) {
          triggerSync()
        }

        return action.id
      } catch (error) {
        console.error("Error storing pending action:", error)
        toast({
          title: "Error",
          description: "No se pudo guardar la acción",
          variant: "destructive",
        })
        throw error
      }
    },
    [syncStatus.isOnline, loadPendingActions, toast],
  )

  // Función para disparar sincronización manual
  const triggerSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true }))

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready

        // Registrar background sync para cada tipo
        if ("sync" in registration) {
          await registration.sync.register("expense-sync")
          await registration.sync.register("group-sync")
          await registration.sync.register("user-sync")
        }
      }
    } catch (error) {
      console.error("Error triggering sync:", error)
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }))
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing])

  // Función para limpiar acciones pendientes manualmente
  const clearPendingActions = useCallback(async () => {
    try {
      await clearAllPendingActions()
      await loadPendingActions()
    } catch (error) {
      console.error("Error clearing pending actions:", error)
    }
  }, [loadPendingActions])

  return {
    ...syncStatus,
    addPendingAction,
    triggerSync,
    clearPendingActions,
    refreshPendingActions: loadPendingActions,
  }
}

// Funciones helper para IndexedDB
async function storePendingAction(action: PendingAction): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pendingActions"], "readwrite")
      const store = transaction.objectStore("pendingActions")
      const addRequest = store.add(action)

      addRequest.onsuccess = () => resolve()
      addRequest.onerror = () => reject(addRequest.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        const store = db.createObjectStore("pendingActions", { keyPath: "id" })
        store.createIndex("type", "type", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

async function getAllPendingActions(): Promise<PendingAction[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        resolve([])
        return
      }

      const transaction = db.transaction(["pendingActions"], "readonly")
      const store = transaction.objectStore("pendingActions")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || [])
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        const store = db.createObjectStore("pendingActions", { keyPath: "id" })
        store.createIndex("type", "type", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

async function clearAllPendingActions(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        resolve()
        return
      }

      const transaction = db.transaction(["pendingActions"], "readwrite")
      const store = transaction.objectStore("pendingActions")
      const clearRequest = store.clear()

      clearRequest.onsuccess = () => resolve()
      clearRequest.onerror = () => reject(clearRequest.error)
    }
  })
}
