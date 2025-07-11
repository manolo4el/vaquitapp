import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./ClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Vaquitapp - Gastos entre amigos",
    template: "%s | Vaquitapp",
  },
  description: "Organiza y divide gastos entre amigos de forma fácil y rápida",
  keywords: ["gastos", "amigos", "dividir", "expenses", "split", "vaquitapp"],
  authors: [{ name: "Vaquitapp Team" }],
  creator: "Vaquitapp",
  publisher: "Vaquitapp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vaquitapp.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vaquitapp - Gastos entre amigos",
    description: "Organiza y divide gastos entre amigos de forma fácil y rápida",
    url: "https://vaquitapp.vercel.app",
    siteName: "Vaquitapp",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Vaquitapp Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaquitapp - Gastos entre amigos",
    description: "Organiza y divide gastos entre amigos de forma fácil y rápida",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vaquitapp",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  themeColor: "#22c55e",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
