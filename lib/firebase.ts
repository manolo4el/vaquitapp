import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth"

// Configuración de Firebase - Usar variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Verificar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("❌ Firebase configuration missing. Please set the following environment variables:")
  console.error("- NEXT_PUBLIC_FIREBASE_API_KEY")
  console.error("- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") 
  console.error("- NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  console.error("- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")
  console.error("- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")
  console.error("- NEXT_PUBLIC_FIREBASE_APP_ID")
  
  // Fallback a configuración de prueba (solo para desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.warn("⚠️ Using fallback Firebase config for development")
    Object.assign(firebaseConfig, {
      apiKey: "AIzaSyCaWsgwyBmvlm266WnloJV6etlQr7igSgs",
      authDomain: "divisor-gastos-42acd.firebaseapp.com",
      projectId: "divisor-gastos-42acd",
      storageBucket: "divisor-gastos-42acd.appspot.com",
      messagingSenderId: "163528661432",
      appId: "1:163528661432:web:8f9a1b2c3d4e5f6g7h8i9j0k",
    })
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app)

// Initialize Google Auth Provider with better configuration
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("email")
googleProvider.addScope("profile")
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forzar selección de cuenta para evitar problemas de sesión
})

// Log Firebase initialization
console.log("🔥 Firebase initialized with project:", firebaseConfig.projectId)
console.log("🔐 Auth domain:", firebaseConfig.authDomain)

export default app
