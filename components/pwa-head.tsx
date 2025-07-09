"use client"

import { useEffect } from "react"

export default function PWAHead() {
  useEffect(() => {
    // Agregar meta tags que Next.js no maneja automáticamente
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement("meta")
        meta.name = name
        meta.content = content
        document.head.appendChild(meta)
      }
    }

    const addLinkTag = (rel: string, href: string, sizes?: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link")
        link.rel = rel
        link.href = href
        if (sizes) link.setAttribute("sizes", sizes)
        document.head.appendChild(link)
      }
    }

    // Meta tags adicionales para PWA
    addMetaTag("mobile-web-app-capable", "yes")
    addMetaTag("apple-mobile-web-app-capable", "yes")
    addMetaTag("apple-mobile-web-app-status-bar-style", "default")
    addMetaTag("apple-mobile-web-app-title", "Vaquitapp")
    addMetaTag("application-name", "Vaquitapp")
    addMetaTag("msapplication-TileColor", "#22c55e")
    addMetaTag("msapplication-TileImage", "/icons/icon-192.png")

    // Links adicionales
    addLinkTag("apple-touch-icon", "/icons/icon-192.png", "192x192")
    addLinkTag("apple-touch-icon", "/icons/icon-512.png", "512x512")

    // Asegurar que el manifest esté presente
    if (!document.querySelector('link[rel="manifest"]')) {
      addLinkTag("manifest", "/manifest.json")
    }
  }, [])

  return null
}
