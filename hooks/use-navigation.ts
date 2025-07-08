"use client"

import { useState, useCallback } from "react"

export type PageType =
  | "dashboard"
  | "add-expense"
  | "profile"
  | "group-details"
  | "group-join"
  | "debt-consolidation"
  | "expense-detail"

interface NavigationState {
  currentPage: PageType
  selectedGroupId: string | null
  selectedExpenseId: string | null
  selectedInvitationId: string | null
}

export function useNavigation() {
  const [state, setState] = useState<NavigationState>({
    currentPage: "dashboard",
    selectedGroupId: null,
    selectedExpenseId: null,
    selectedInvitationId: null,
  })

  const navigateTo = useCallback((page: PageType, param?: string, secondParam?: string) => {
    setState((prevState) => {
      const newState: NavigationState = {
        ...prevState,
        currentPage: page,
      }

      // Reset all selections first
      newState.selectedGroupId = null
      newState.selectedExpenseId = null
      newState.selectedInvitationId = null

      // Set the appropriate parameter based on the page
      switch (page) {
        case "group-details":
        case "add-expense":
          newState.selectedGroupId = param || null
          break
        case "expense-detail":
          newState.selectedGroupId = param || null
          newState.selectedExpenseId = secondParam || null
          break
        case "group-join":
          newState.selectedInvitationId = param || null
          break
        default:
          // For other pages, no specific parameters needed
          break
      }

      return newState
    })
  }, [])

  return {
    ...state,
    navigateTo,
  }
}
