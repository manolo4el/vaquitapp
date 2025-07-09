"use client"

import type React from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { InstallPrompt } from "@/components/install-prompt"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InstallPrompt />
        {children}
      </AuthProvider>
    </ErrorBoundary>
  )
}
