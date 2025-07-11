"use client"

import type React from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PWAHead } from "@/components/pwa-head"
import { SyncStatus } from "@/components/sync-status"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <AuthProvider>
        <PWAHead />
        <SyncStatus />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
