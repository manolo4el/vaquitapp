"use client"
import { logEvent } from "firebase/analytics"
import { analytics } from "@/lib/firebase"

export function useAnalytics() {
  const trackEvent = (eventName: string, parameters?: { [key: string]: any }) => {
    if (analytics) {
      try {
        logEvent(analytics, eventName, parameters)
        console.log(`Analytics event tracked: ${eventName}`, parameters)
      } catch (error) {
        console.error("Error tracking analytics event:", error)
      }
    }
  }

  const trackPageView = (pageName: string) => {
    trackEvent("page_view", {
      page_title: pageName,
      page_location: window.location.href,
    })
  }

  const trackUserAction = (action: string, details?: { [key: string]: any }) => {
    trackEvent("user_action", {
      action_name: action,
      ...details,
    })
  }

  const trackGroupAction = (action: string, groupId?: string, details?: { [key: string]: any }) => {
    trackEvent("group_action", {
      action_name: action,
      group_id: groupId,
      ...details,
    })
  }

  const trackExpenseAction = (action: string, amount?: number, groupId?: string) => {
    trackEvent("expense_action", {
      action_name: action,
      expense_amount: amount,
      group_id: groupId,
    })
  }

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackGroupAction,
    trackExpenseAction,
  }
}
