"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Analytics se inicializa automáticamente en firebase.ts
    // Este useEffect solo asegura que el componente sea del cliente
  }, [])

  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/cow-logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/cow-logo.svg" />
        <link rel="apple-touch-icon" href="/cow-logo.svg" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
