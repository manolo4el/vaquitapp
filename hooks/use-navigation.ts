"use client"

import { useState } from "react"

export type NavigationPage =
  | "dashboard"
  | "add-expense"
  | "profile"
  | "group-details"
  | "group-join"
  | "debt-consolidation"
  | "expense-detail"
  | "login"
  | "privacy-policy"

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  const navigateTo = (page: NavigationPage, groupId?: string, expenseId?: string) => {
    setCurrentPage(page)
    if (groupId) {
      setSelectedGroupId(groupId)
    }
    if (expenseId) {
      setSelectedExpenseId(expenseId)
    }
  }

  const goBack = () => {
    if (currentPage === "add-expense" || currentPage === "group-details") {
      setCurrentPage("dashboard")
    } else if (currentPage === "expense-detail") {
      if (selectedGroupId) {
        setCurrentPage("group-details")
      } else {
        setCurrentPage("dashboard")
      }
    } else if (currentPage === "privacy-policy") {
      setCurrentPage("login")
    } else {
      setCurrentPage("dashboard")
    }
  }

  return {
    currentPage,
    selectedGroupId,
    selectedExpenseId,
    navigateTo,
    goBack,
  }
}
