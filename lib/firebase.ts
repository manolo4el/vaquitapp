import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicializar Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Variables para auth y provider
let auth: any = null
let googleProvider: GoogleAuthProvider | null = null

// Función para inicializar auth de forma segura
export function initializeFirebaseAuth() {
  if (typeof window === "undefined") {
    return { auth: null, googleProvider: null }
  }

  if (!auth) {
    try {
      auth = getAuth(app)
      googleProvider = new GoogleAuthProvider()
      googleProvider.addScope("email")
      googleProvider.addScope("profile")
      console.log("Firebase Auth inicializado correctamente")
    } catch (error) {
      console.error("Error al inicializar Firebase Auth:", error)
      return { auth: null, googleProvider: null }
    }
  }

  return { auth, googleProvider }
}

export { app }
export default app
