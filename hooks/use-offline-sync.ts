"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface PendingAction {
  id: string
  type: "expense" | "group" | "userData"
  data: any
  timestamp: number
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [syncInProgress, setSyncInProgress] = useState(false)
  const { toast } = useToast()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Conexión restaurada",
        description: "Sincronizando datos pendientes...",
      })
      triggerBackgroundSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Sin conexión",
        description: "Los cambios se guardarán y sincronizarán cuando vuelvas a estar online",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Listen for sync messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "SYNC_COMPLETE") {
        const { type, count } = event.data.data
        toast({
          title: "Sincronización completada",
          description: `${count} ${type} sincronizados correctamente`,
        })
        loadPendingActions()
      }
    }

    navigator.serviceWorker?.addEventListener("message", handleMessage)
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage)
    }
  }, [toast])

  // Load pending actions from IndexedDB
  const loadPendingActions = useCallback(async () => {
    try {
      const db = await openDB()
      const stores = ["pendingExpenses", "pendingGroups", "pendingUserData"]
      const allPending: PendingAction[] = []

      for (const storeName of stores) {
        const data = await getFromStore(db, storeName)
        allPending.push(
          ...data.map((item: any) => ({
            id: item.id,
            type: storeName.replace("pending", "").toLowerCase() as any,
            data: item,
            timestamp: item.timestamp || Date.now(),
          })),
        )
      }

      setPendingActions(allPending)
    } catch (error) {
      console.error("Error loading pending actions:", error)
    }
  }, [])

  // Store action for offline sync
  const storeOfflineAction = useCallback(
    async (type: "expense" | "group" | "userData", data: any) => {
      try {
        const db = await openDB()
        const storeName = `pending${type.charAt(0).toUpperCase() + type.slice(1)}s`
        const actionData = {
          ...data,
          id: data.id || generateId(),
          timestamp: Date.now(),
        }

        await addToStore(db, storeName, actionData)
        await loadPendingActions()

        // Register for background sync
        if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready
          await registration.sync.register(`${type}-sync`)
        }

        toast({
          title: "Acción guardada",
          description: "Se sincronizará cuando vuelvas a estar online",
        })
      } catch (error) {
        console.error("Error storing offline action:", error)
        toast({
          title: "Error",
          description: "No se pudo guardar la acción offline",
          variant: "destructive",
        })
      }
    },
    [toast, loadPendingActions],
  )

  // Trigger background sync manually
  const triggerBackgroundSync = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("sync" in window.ServiceWorkerRegistration.prototype)) {
      return
    }

    try {
      setSyncInProgress(true)
      const registration = await navigator.serviceWorker.ready

      await Promise.all([
        registration.sync.register("expense-sync"),
        registration.sync.register("group-sync"),
        registration.sync.register("user-sync"),
      ])
    } catch (error) {
      console.error("Error triggering background sync:", error)
    } finally {
      setSyncInProgress(false)
    }
  }, [])

  // Initialize
  useEffect(() => {
    loadPendingActions()
  }, [loadPendingActions])

  return {
    isOnline,
    pendingActions,
    syncInProgress,
    storeOfflineAction,
    triggerBackgroundSync,
    loadPendingActions,
  }
}

// Helper functions for IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      const stores = ["pendingExpenses", "pendingGroups", "pendingUserData"]
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true })
        }
      })
    }
  })
}

function getFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve([])
      return
    }

    const transaction = db.transaction([storeName], "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function addToStore(db: IDBDatabase, storeName: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.add(data)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
