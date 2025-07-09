"use client"

import { useOfflineSync } from "@/hooks/use-offline-sync"
import { useToast } from "@/hooks/use-toast"
import { useCallback } from "react"

interface Expense {
  id?: string
  groupId: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: string
  category?: string
}

export function useExpenseActions() {
  const { isOnline, storeOfflineAction } = useOfflineSync()
  const { toast } = useToast()

  const addExpense = useCallback(
    async (expense: Expense) => {
      try {
        if (isOnline) {
          // Try to add expense online first
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense),
          })

          if (!response.ok) {
            throw new Error("Failed to add expense online")
          }

          const result = await response.json()
          toast({
            title: "Gasto agregado",
            description: "El gasto se ha guardado correctamente",
          })
          return result
        } else {
          // Store for offline sync
          await storeOfflineAction("expense", expense)
          return { id: expense.id || Date.now().toString(), ...expense }
        }
      } catch (error) {
        console.error("Error adding expense:", error)

        // If online request fails, store for offline sync
        if (isOnline) {
          await storeOfflineAction("expense", expense)
          toast({
            title: "Error de conexión",
            description: "El gasto se guardará y sincronizará más tarde",
            variant: "destructive",
          })
        }

        return { id: expense.id || Date.now().toString(), ...expense }
      }
    },
    [isOnline, storeOfflineAction, toast],
  )

  const updateExpense = useCallback(
    async (id: string, expense: Partial<Expense>) => {
      try {
        if (isOnline) {
          const response = await fetch(`/api/expenses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense),
          })

          if (!response.ok) {
            throw new Error("Failed to update expense online")
          }

          const result = await response.json()
          toast({
            title: "Gasto actualizado",
            description: "Los cambios se han guardado correctamente",
          })
          return result
        } else {
          await storeOfflineAction("expense", { id, ...expense })
          return { id, ...expense }
        }
      } catch (error) {
        console.error("Error updating expense:", error)

        if (isOnline) {
          await storeOfflineAction("expense", { id, ...expense })
          toast({
            title: "Error de conexión",
            description: "Los cambios se guardarán y sincronizarán más tarde",
            variant: "destructive",
          })
        }

        return { id, ...expense }
      }
    },
    [isOnline, storeOfflineAction, toast],
  )

  return {
    addExpense,
    updateExpense,
    isOnline,
  }
}
