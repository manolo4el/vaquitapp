import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"

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
  return <ClientLayout>{children}</ClientLayout>
}


import './globals.css'