"use client"

import { useState, useCallback } from "react"

type Page =
  | "dashboard"
  | "add-expense"
  | "profile"
  | "group-details"
  | "group-join"
  | "debt-consolidation"
  | "expense-detail"

interface NavigationState {
  currentPage: Page
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

  const navigateTo = useCallback((page: Page, param1?: string, param2?: string) => {
    setState((prevState) => {
      const newState: NavigationState = {
        ...prevState,
        currentPage: page,
      }

      // Reset all selections first
      newState.selectedGroupId = null
      newState.selectedExpenseId = null
      newState.selectedInvitationId = null

      // Set appropriate selection based on page
      switch (page) {
        case "group-details":
        case "add-expense":
          newState.selectedGroupId = param1 || null
          break
        case "group-join":
          newState.selectedInvitationId = param1 || null
          break
        case "expense-detail":
          newState.selectedGroupId = param1 || null
          newState.selectedExpenseId = param2 || null
          break
        default:
          // For dashboard, profile, debt-consolidation, no additional params needed
          break
      }

      return newState
    })
  }, [])

  return {
    currentPage: state.currentPage,
    selectedGroupId: state.selectedGroupId,
    selectedExpenseId: state.selectedExpenseId,
    selectedInvitationId: state.selectedInvitationId,
    navigateTo,
  }
}
