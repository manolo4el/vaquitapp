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

// Solo exportar funciones que inicialicen auth cuando sea necesario
export function getFirebaseAuth() {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth solo puede ser usado en el cliente")
  }
  return getAuth(app)
}

export function getGoogleProvider() {
  if (typeof window === "undefined") {
    throw new Error("Google Provider solo puede ser usado en el cliente")
  }
  const provider = new GoogleAuthProvider()
  provider.addScope("email")
  provider.addScope("profile")
  return provider
}

export default app
