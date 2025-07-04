"use client"

import { useCallback } from "react"
import { logEvent } from "firebase/analytics"
import { analytics } from "@/lib/firebase"

export function useAnalytics() {
  const trackPageView = useCallback((pageName: string, additionalParams?: Record<string, any>) => {
    if (!analytics) return

    try {
      logEvent(analytics, "page_view", {
        page_title: pageName,
        page_location: window.location.href,
        ...additionalParams,
      })
      console.log("Page view tracked:", pageName)
    } catch (error) {
      console.error("Error tracking page view:", error)
    }
  }, [])

  const trackUserAction = useCallback((action: string, additionalParams?: Record<string, any>) => {
    if (!analytics) return

    try {
      logEvent(analytics, "user_action", {
        action_name: action,
        timestamp: new Date().toISOString(),
        ...additionalParams,
      })
      console.log("User action tracked:", action)
    } catch (error) {
      console.error("Error tracking user action:", error)
    }
  }, [])

  const trackGroupAction = useCallback((action: string, groupId: string, additionalParams?: Record<string, any>) => {
    if (!analytics) return

    try {
      logEvent(analytics, "group_action", {
        action_name: action,
        group_id: groupId,
        timestamp: new Date().toISOString(),
        ...additionalParams,
      })
      console.log("Group action tracked:", action, groupId)
    } catch (error) {
      console.error("Error tracking group action:", error)
    }
  }, [])

  const trackExpenseAction = useCallback(
    (action: string, amount: number, groupId: string, additionalParams?: Record<string, any>) => {
      if (!analytics) return

      try {
        logEvent(analytics, "expense_action", {
          action_name: action,
          amount: amount,
          group_id: groupId,
          timestamp: new Date().toISOString(),
          ...additionalParams,
        })
        console.log("Expense action tracked:", action, amount, groupId)
      } catch (error) {
        console.error("Error tracking expense action:", error)
      }
    },
    [],
  )

  return {
    trackPageView,
    trackUserAction,
    trackGroupAction,
    trackExpenseAction,
  }
}
