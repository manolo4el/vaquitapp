"use client"

import { useEffect } from "react"

export function PWAHead() {
  useEffect(() => {
    // Funciones auxiliares para agregar meta y link tags
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement("meta")
        meta.name = name
        meta.content = content
        document.head.appendChild(meta)
      }
    }

    const addLinkTag = (rel: string, href: string, sizes?: string) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement("link")
        link.rel = rel
        link.href = href
        if (sizes) link.setAttribute("sizes", sizes)
        document.head.appendChild(link)
      }
    }

    // Meta tags para PWA
    addMetaTag("mobile-web-app-capable", "yes")
    addMetaTag("apple-mobile-web-app-capable", "yes")
    addMetaTag("apple-mobile-web-app-status-bar-style", "default")
    addMetaTag("apple-mobile-web-app-title", "Vaquitapp")
    addMetaTag("application-name", "Vaquitapp")
    addMetaTag("msapplication-TileColor", "#22c55e")
    addMetaTag("msapplication-tap-highlight", "no")

    // Links para PWA
    addLinkTag("manifest", "/manifest.json")
    addLinkTag("apple-touch-icon", "/icons/icon-192.png")
    addLinkTag("apple-touch-icon", "/icons/icon-192.png", "192x192")
    addLinkTag("apple-touch-icon", "/icons/icon-512.png", "512x512")

    // Registrar service worker si no está registrado
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("SW registered: ", registration)
            })
            .catch((registrationError) => {
              console.log("SW registration failed: ", registrationError)
            })
        }
      })
    }

    // Solicitar permisos de notificación
    if ("Notification" in window && "serviceWorker" in navigator) {
      if (Notification.permission === "default") {
        // Esperar un poco antes de solicitar permisos para mejor UX
        setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            console.log("Notification permission:", permission)
            if (permission === "granted") {
              // Opcional: suscribirse a push notifications aquí
              subscribeUserToPush()
            }
          })
        }, 5000) // 5 segundos después de cargar
      }
    }
  }, [])

  return null // Este componente no renderiza nada visible
}

// Función para suscribirse a push notifications
async function subscribeUserToPush() {
  try {
    const registration = await navigator.serviceWorker.ready

    // Verificar si ya está suscrito
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      console.log("User is already subscribed to push notifications")
      return existingSubscription
    }

    // Clave pública VAPID (deberías generar tu propia clave)
    const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f4LSDiZSWfYd7p45P7P5-jjjuuMdRYF3nNQ4vqQHXGCMjEqDDUc"

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    console.log("User subscribed to push notifications:", subscription)

    // Enviar la suscripción al servidor (implementar según tu backend)
    // await fetch('/api/push-subscription', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // })

    return subscription
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
  }
}

// Función helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default PWAHead
