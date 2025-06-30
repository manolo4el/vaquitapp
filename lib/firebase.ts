import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let auth: Auth
let googleProvider: GoogleAuthProvider

// Función para inicializar Firebase de forma segura
function initializeFirebase() {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side")
  }

  if (!auth) {
    auth = getAuth(app)
  }

  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider()
    googleProvider.addScope("email")
    googleProvider.addScope("profile")
  }
}

// Función para obtener la instancia de Auth
export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used on the client side")
  }

  if (!auth) {
    initializeFirebase()
  }

  return auth
}

// Función para obtener el provider de Google
export function getGoogleProvider(): GoogleAuthProvider {
  if (typeof window === "undefined") {
    throw new Error("Google provider can only be used on the client side")
  }

  if (!googleProvider) {
    initializeFirebase()
  }

  return googleProvider
}

export default app
