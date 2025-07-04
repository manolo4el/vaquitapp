import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vaquitapp - Divide gastos entre amigos",
  description: "Aplicación para dividir gastos entre amigos de forma fácil y eficiente",
  icons: {
    icon: "/cow-logo.svg",
    shortcut: "/cow-logo.svg",
    apple: "/cow-logo.svg",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
