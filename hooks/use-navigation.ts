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

      // Reset all params first
      newState.selectedGroupId = null
      newState.selectedExpenseId = null
      newState.selectedInvitationId = null

      // Set appropriate param based on page
      switch (page) {
        case "group-details":
        case "add-expense":
          newState.selectedGroupId = param || null
          break
        case "group-join":
          newState.selectedInvitationId = param || null
          break
        case "expense-detail":
          newState.selectedGroupId = param || null
          newState.selectedExpenseId = secondParam || null
          break
        default:
          // For dashboard, profile, debt-consolidation, no params needed
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
