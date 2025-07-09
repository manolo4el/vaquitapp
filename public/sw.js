const CACHE_NAME = "vaquitapp-v1"
const STATIC_CACHE = "vaquitapp-static-v1"
const API_CACHE = "vaquitapp-api-v1"

// Archivos estáticos para cachear
const STATIC_FILES = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/offline.html"]

// URLs de API para cachear
const API_URLS = ["/api/expenses", "/api/groups", "/api/users"]

// Instalar service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_FILES)
      }),
      caches.open(API_CACHE),
    ]).then(() => {
      console.log("Service Worker installed successfully")
      return self.skipWaiting()
    }),
  )
})

// Activar service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker activated")
        return self.clients.claim()
      }),
  )
})

// Interceptar requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Estrategia para archivos estáticos
  if (STATIC_FILES.some((file) => url.pathname === file)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
      }),
    )
    return
  }

  // Estrategia para APIs
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo cachear respuestas exitosas de GET
          if (request.method === "GET" && response.status === 200) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla, intentar desde cache
          return caches.match(request)
        }),
    )
    return
  }

  // Estrategia por defecto: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response
      })
      .catch(() => {
        return caches.match(request)
      }),
  )
})

// Background Sync
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "expense-sync") {
    event.waitUntil(syncPendingActions("expenses"))
  } else if (event.tag === "group-sync") {
    event.waitUntil(syncPendingActions("groups"))
  } else if (event.tag === "user-sync") {
    event.waitUntil(syncPendingActions("users"))
  }
})

// Función para sincronizar acciones pendientes
async function syncPendingActions(type) {
  try {
    console.log(`Syncing pending ${type} actions...`)

    const db = await openIndexedDB()
    const actions = await getPendingActionsByType(db, type)

    let syncedCount = 0

    for (const action of actions) {
      try {
        const endpoint = `/api/${type}`
        const response = await fetch(endpoint, {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
        })

        if (response.ok) {
          await deletePendingAction(db, action.id)
          syncedCount++
          console.log(`Synced ${type} action:`, action.id)
        } else {
          console.error(`Failed to sync ${type} action:`, action.id, response.status)
          // Incrementar contador de reintentos
          await incrementRetryCount(db, action.id)
        }
      } catch (error) {
        console.error(`Error syncing ${type} action:`, action.id, error)
        await incrementRetryCount(db, action.id)
      }
    }

    // Notificar a los clientes sobre la sincronización completada
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        data: { type, count: syncedCount },
      })
    })

    console.log(`Sync completed for ${type}: ${syncedCount} actions synced`)
  } catch (error) {
    console.error(`Error during ${type} sync:`, error)
  }
}

// Push Notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event)

  const options = {
    body: "Tienes nuevas actualizaciones en Vaquitapp",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver detalles",
        icon: "/icons/icon-192.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icons/icon-192.png",
      },
    ],
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data = { ...options.data, ...data }
  }

  event.waitUntil(self.registration.showNotification("Vaquitapp", options))
})

// Manejar clicks en notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "close") {
    // Solo cerrar la notificación
    return
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(clients.openWindow("/"))
  }
})

// Funciones helper para IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        const store = db.createObjectStore("pendingActions", { keyPath: "id" })
        store.createIndex("type", "type", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

function getPendingActionsByType(db, type) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingActions"], "readonly")
    const store = transaction.objectStore("pendingActions")
    const index = store.index("type")
    const request = index.getAll(type)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

function deletePendingAction(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingActions"], "readwrite")
    const store = transaction.objectStore("pendingActions")
    const request = store.delete(actionId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function incrementRetryCount(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingActions"], "readwrite")
    const store = transaction.objectStore("pendingActions")

    const getRequest = store.get(actionId)
    getRequest.onsuccess = () => {
      const action = getRequest.result
      if (action) {
        action.retryCount = (action.retryCount || 0) + 1
        action.lastRetry = Date.now()

        const putRequest = store.put(action)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}
