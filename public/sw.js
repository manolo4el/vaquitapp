const CACHE_NAME = "vaquitapp-v1"
const urlsToCache = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/cow-logo.svg"]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      ),
    ),
  )
  self.clients.claim()
})

// Fetch event with offline support
self.addEventListener("fetch", (event) => {
  // Handle API requests differently
  if (event.request.url.includes("/api/") || event.request.url.includes("firestore")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If online, return response and cache if it's a GET request
          if (event.request.method === "GET" && response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline fallback for API requests
            return new Response(
              JSON.stringify({
                error: "Offline",
                message: "Esta acción se sincronizará cuando vuelvas a estar online",
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
  } else {
    // Handle static resources
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      }),
    )
  }
})

// Background Sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "expense-sync") {
    event.waitUntil(syncExpenses())
  }
  if (event.tag === "group-sync") {
    event.waitUntil(syncGroups())
  }
  if (event.tag === "user-sync") {
    event.waitUntil(syncUserData())
  }
})

// Sync functions
async function syncExpenses() {
  try {
    const pendingExpenses = await getStoredData("pendingExpenses")
    if (pendingExpenses && pendingExpenses.length > 0) {
      for (const expense of pendingExpenses) {
        try {
          await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense),
          })
        } catch (error) {
          console.log("Failed to sync expense:", error)
          throw error // Re-throw to retry later
        }
      }
      // Clear synced expenses
      await clearStoredData("pendingExpenses")

      // Notify clients about successful sync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_COMPLETE",
            data: { type: "expenses", count: pendingExpenses.length },
          })
        })
      })
    }
  } catch (error) {
    console.log("Expense sync failed, will retry later:", error)
  }
}

async function syncGroups() {
  try {
    const pendingGroups = await getStoredData("pendingGroups")
    if (pendingGroups && pendingGroups.length > 0) {
      for (const group of pendingGroups) {
        try {
          await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(group),
          })
        } catch (error) {
          console.log("Failed to sync group:", error)
          throw error
        }
      }
      await clearStoredData("pendingGroups")

      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_COMPLETE",
            data: { type: "groups", count: pendingGroups.length },
          })
        })
      })
    }
  } catch (error) {
    console.log("Group sync failed, will retry later:", error)
  }
}

async function syncUserData() {
  try {
    const pendingUserData = await getStoredData("pendingUserData")
    if (pendingUserData && pendingUserData.length > 0) {
      for (const userData of pendingUserData) {
        try {
          await fetch("/api/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          })
        } catch (error) {
          console.log("Failed to sync user data:", error)
          throw error
        }
      }
      await clearStoredData("pendingUserData")

      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_COMPLETE",
            data: { type: "userData", count: pendingUserData.length },
          })
        })
      })
    }
  } catch (error) {
    console.log("User data sync failed, will retry later:", error)
  }
}

// Helper functions for IndexedDB storage
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([])
        return
      }

      const transaction = db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

async function clearStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VaquitappOfflineDB", 1)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        resolve()
        return
      }

      const transaction = db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const clearRequest = store.clear()

      clearRequest.onsuccess = () => resolve()
      clearRequest.onerror = () => reject(clearRequest.error)
    }
  })
}

// Handle push notifications for sync updates
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || "Datos sincronizados correctamente",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "sync-notification",
      requireInteraction: false,
      actions: [
        {
          action: "view",
          title: "Ver cambios",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title || "Vaquitapp", options))
  }
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"))
  }
})
