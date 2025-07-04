"use client"

import { useState } from "react"

export type Page =
  | "dashboard"
  | "add-expense"
  | "profile"
  | "group-details"
  | "group-join"
  | "debt-consolidation"
  | "expense-detail"

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  const navigateTo = (page: Page, groupId?: string, expenseId?: string) => {
    console.log(
      "Navigating to:",
      page,
      groupId ? `with group ${groupId}` : "",
      expenseId ? `with expense ${expenseId}` : "",
    )
    setCurrentPage(page)
    if (groupId) {
      setSelectedGroupId(groupId)
    } else if (page === "dashboard") {
      setSelectedGroupId(null)
    }
    if (expenseId) {
      setSelectedExpenseId(expenseId)
    } else if (page !== "expense-detail") {
      setSelectedExpenseId(null)
    }
  }

  const setGroupId = (groupId: string | null) => {
    setSelectedGroupId(groupId)
  }

  return {
    currentPage,
    selectedGroupId,
    selectedExpenseId,
    navigateTo,
    setSelectedGroupId: setGroupId,
  }
}
