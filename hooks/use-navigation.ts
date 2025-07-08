"use client"

import { useState, useCallback } from "react"

export type Page =
  | "dashboard"
  | "add-expense"
  | "group-details"
  | "group-join"
  | "user-profile"
  | "debt-consolidation"
  | "expense-detail"

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  const navigateTo = useCallback((page: Page, param?: string) => {
    setCurrentPage(page)

    // Limpiar todos los parámetros primero
    setSelectedGroupId(null)
    setSelectedInvitationId(null)
    setSelectedExpenseId(null)

    // Establecer el parámetro correcto según la página
    switch (page) {
      case "group-details":
      case "add-expense":
      case "debt-consolidation":
        if (param) setSelectedGroupId(param)
        break
      case "group-join":
        if (param) setSelectedInvitationId(param)
        break
      case "expense-detail":
        if (param) setSelectedExpenseId(param)
        break
      default:
        break
    }
  }, [])

  const goBack = useCallback(() => {
    setCurrentPage("dashboard")
    setSelectedGroupId(null)
    setSelectedInvitationId(null)
    setSelectedExpenseId(null)
  }, [])

  return {
    currentPage,
    selectedGroupId,
    selectedInvitationId,
    selectedExpenseId,
    navigateTo,
    goBack,
  }
}
