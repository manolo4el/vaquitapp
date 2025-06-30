import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth

// Función para inicializar Firebase de forma segura
function initializeFirebase() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    // Verificar si ya existe una app inicializada
    const existingApps = getApps()
    if (existingApps.length > 0) {
      app = existingApps[0]
    } else {
      app = initializeApp(firebaseConfig)
    }

    // Inicializar Auth
    auth = getAuth(app)

    return { app, auth }
  } catch (error) {
    console.error("Error inicializando Firebase:", error)
    return null
  }
}

// Función para obtener la instancia de Auth de forma segura
export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") {
    return null
  }

  if (!auth) {
    const firebase = initializeFirebase()
    if (!firebase) return null
    auth = firebase.auth
  }

  return auth
}

// Función para obtener la app de Firebase
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null
  }

  if (!app) {
    const firebase = initializeFirebase()
    if (!firebase) return null
    app = firebase.app
  }

  return app
}

export { app, auth }
