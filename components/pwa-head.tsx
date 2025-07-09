"use client"

import { useEffect } from "react"

export function PWAHead() {
  useEffect(() => {
    // Asegurar que el manifest link esté presente
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement("link")
      manifestLink.rel = "manifest"
      manifestLink.href = "/manifest.json"
      document.head.appendChild(manifestLink)
    }

    // Asegurar que el theme-color esté presente
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeColorMeta = document.createElement("meta")
      themeColorMeta.name = "theme-color"
      themeColorMeta.content = "#22c55e"
      document.head.appendChild(themeColorMeta)
    }

    // Verificar que el manifest sea accesible
    fetch("/manifest.json")
      .then((response) => {
        if (response.ok) {
          console.log("Manifest accessible:", response.status)
        } else {
          console.error("Manifest not accessible:", response.status)
        }
      })
      .catch((error) => {
        console.error("Error fetching manifest:", error)
      })
  }, [])

  return null
}

// Export por defecto también para compatibilidad
export default PWAHead
