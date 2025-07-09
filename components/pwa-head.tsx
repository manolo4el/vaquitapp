"use client"

import { useEffect } from "react"
import Head from "next/head"

export function PWAHead() {
  useEffect(() => {
    // Registrar service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)

          // Solicitar permisos para notificaciones push
          if ("Notification" in window && "PushManager" in window) {
            if (Notification.permission === "default") {
              Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                  console.log("Notification permission granted")
                  // Aquí podrías suscribir al usuario para push notifications
                  subscribeUserToPush(registration)
                }
              })
            } else if (Notification.permission === "granted") {
              subscribeUserToPush(registration)
            }
          }
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }

    // Escuchar mensajes del service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_COMPLETE") {
          console.log("Sync completed:", event.data.data)
        }
      })
    }
  }, [])

  return (
    <Head>
      <meta name="application-name" content="Vaquitapp" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Vaquitapp" />
      <meta name="description" content="Aplicación para gestionar gastos compartidos entre amigos y grupos" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/icons/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#22c55e" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#22c55e" />

      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />

      <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192.png" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/icons/icon-192.png" color="#22c55e" />
      <link rel="shortcut icon" href="/favicon.ico" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:url" content="https://vaquitapp.vercel.app" />
      <meta name="twitter:title" content="Vaquitapp" />
      <meta name="twitter:description" content="Aplicación para gestionar gastos compartidos entre amigos y grupos" />
      <meta name="twitter:image" content="https://vaquitapp.vercel.app/icons/icon-192.png" />
      <meta name="twitter:creator" content="@vaquitapp" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Vaquitapp" />
      <meta property="og:description" content="Aplicación para gestionar gastos compartidos entre amigos y grupos" />
      <meta property="og:site_name" content="Vaquitapp" />
      <meta property="og:url" content="https://vaquitapp.vercel.app" />
      <meta property="og:image" content="https://vaquitapp.vercel.app/icons/icon-192.png" />

      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
      />
    </Head>
  )
}

// Función para suscribir al usuario a push notifications
async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // Aquí deberías poner tu clave VAPID pública
        "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f4LUjqukYiLdyMYGTJNF50F2uLpgPppRWwWBjGBpHYdx2BzcfXM",
      ),
    })

    console.log("User subscribed to push notifications:", subscription)

    // Aquí enviarías la suscripción a tu servidor
    // await fetch('/api/push-subscription', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // })
  } catch (error) {
    console.error("Failed to subscribe user to push notifications:", error)
  }
}

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
