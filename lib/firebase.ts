import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

// Actualizar la configuración de Firebase con el App ID correcto
const firebaseConfig = {
  apiKey: "AIzaSyCaWsgwyBmvlm266WnloJV6etlQr7igSgs",
  authDomain: "divisor-gastos-42acd.firebaseapp.com",
  projectId: "divisor-gastos-42acd",
  storageBucket: "divisor-gastos-42acd.appspot.com",
  messagingSenderId: "163528661432",
  appId: "1:163528661432:web:8f9a1b2c3d4e5f6g7h8i9j0k",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app)

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("email")
googleProvider.addScope("profile")

export default app
