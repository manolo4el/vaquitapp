import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vaquitapp - Divide gastos fácil y justo",
  description: "La forma más simple de manejar gastos compartidos con tus amigos",
  icons: {
    icon: "/vaquitapp-icon.svg",
    shortcut: "/vaquitapp-icon.svg",
    apple: "/vaquitapp-icon.svg",
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
        <link rel="icon" href="/vaquitapp-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/vaquitapp-icon.svg" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
