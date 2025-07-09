"use client"

import { useOfflineSync } from "@/hooks/use-offline-sync"

export function SyncStatus() {
  // Solo inicializar el hook para que funcione en background
  useOfflineSync()

  // No renderizar nada visible
  return null
}

export default SyncStatus
