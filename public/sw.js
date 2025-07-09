const CACHE_NAME = "vaquitapp-v1"
const STATIC_CACHE_NAME = "vaquitapp-static-v1"

// Archivos estáticos para cachear
const STATIC_FILES = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/cow-logo.svg"]

// URLs de API para cachear dinámicamente
const API_CACHE_PATTERNS = [/^https:\/\/.*\.googleapis\.com/, /^https:\/\/.*\.firebaseapp\.com/, /\/api\//]

// Install event - cachear archivos estáticos
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Caching static files")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("Static files cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Error caching static files:", error)
      }),
  )
})

// Activate event - limpiar caches antiguos
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
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

// Fetch event - estrategia de cache
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests HTTP/HTTPS
  if (!request.url.startsWith("http")) {
    return
  }

  // Estrategia para archivos estáticos
  if (STATIC_FILES.some((file) => url.pathname === file)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
      }),
    )
    return
  }

  // Estrategia para APIs - Network First con fallback a cache
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la respuesta es exitosa, guardar en cache
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            // Si no hay cache, devolver respuesta offline
            return new Response(
              JSON.stringify({
                error: "Offline",
                message: "No hay conexión disponible",
              }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              },
            )
          })
        }),
    )
    return
  }

  // Para otros requests, usar cache first
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            const responseClone = fetchResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
            return fetchResponse
          })
        )
      })
      .catch(() => {
        // Fallback para páginas HTML
        if (request.headers.get("accept").includes("text/html")) {
          return caches.match("/")
        }
      }),
  )
})

// Background Sync para acciones offline
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "expense-sync") {
    event.waitUntil(syncExpenses())
  } else if (event.tag === "group-sync") {
    event.waitUntil(syncGroups())
  } else if (event.tag === "user-sync") {
    event.waitUntil(syncUserData())
  }
})

// Función para sincronizar gastos
async function syncExpenses() {
  try {
    console.log("Syncing expenses...")

    // Obtener acciones pendientes del IndexedDB
    const pendingActions = await getPendingActions("expenses")

    for (const action of pendingActions) {
      try {
        const response = await fetch("/api/expenses", {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
        })

        if (response.ok) {
          // Eliminar acción exitosa del storage
          await removePendingAction("expenses", action.id)
          console.log("Expense synced successfully:", action.id)
        } else {
          console.error("Failed to sync expense:", action.id, response.status)
        }
      } catch (error) {
        console.error("Error syncing expense:", action.id, error)
      }
    }

    // Notificar al cliente que la sincronización terminó
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          data: { type: "expenses", count: pendingActions.length },
        })
      })
    })
  } catch (error) {
    console.error("Error in expense sync:", error)
    throw error
  }
}

// Función para sincronizar grupos
async function syncGroups() {
  try {
    console.log("Syncing groups...")

    const pendingActions = await getPendingActions("groups")

    for (const action of pendingActions) {
      try {
        const response = await fetch("/api/groups", {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
        })

        if (response.ok) {
          await removePendingAction("groups", action.id)
          console.log("Group synced successfully:", action.id)
        }
      } catch (error) {
        console.error("Error syncing group:", action.id, error)
      }
    }

    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          data: { type: "groups", count: pendingActions.length },
        })
      })
    })
  } catch (error) {
    console.error("Error in group sync:", error)
    throw error
  }
}

// Función para sincronizar datos de usuario
async function syncUserData() {
  try {
    console.log("Syncing user data...")

    const pendingActions = await getPendingActions("users")

    for (const action of pendingActions) {
      try {
        const response = await fetch("/api/users", {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
        })

        if (response.ok) {
          await removePendingAction("users", action.id)
          console.log("User data synced successfully:", action.id)
        }
      } catch (error) {
        console.error("Error syncing user data:", action.id, error)
      }
    }

    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          data: { type: "users", count: pendingActions.length },
        })
      })
    })
  } catch (error) {
    console.error("Error in user data sync:", error)
    throw error
  }
}

// Funciones helper para IndexedDB
async function getPendingActions(type) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pendingActions"], "readonly")
      const store = transaction.objectStore("pendingActions")
      const index = store.index("type")
      const getRequest = index.getAll(type)

      getRequest.onsuccess = () => resolve(getRequest.result || [])
      getRequest.onerror = () => reject(getRequest.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("pendingActions")) {
        const store = db.createObjectStore("pendingActions", { keyPath: "id" })
        store.createIndex("type", "type", { unique: false })
      }
    }
  })
}

async function removePendingAction(type, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pendingActions"], "readwrite")
      const store = transaction.objectStore("pendingActions")
      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Manejar mensajes del cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

console.log("Service Worker loaded successfully")
