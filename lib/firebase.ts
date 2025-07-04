import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// Agregar la importación de Analytics
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCaWsgwyBmvlm266WnloJV6etlQr7igSgs",
  authDomain: "divisor-gastos-42acd.firebaseapp.com",
  projectId: "divisor-gastos-42acd",
  storageBucket: "divisor-gastos-42acd.firebasestorage.app", // Corregido
  messagingSenderId: "163528661432",
  appId: "1:163528661432:web:0559e64e085c1c251ed74d",
  measurementId: "G-3NZP8SHPNS",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Después de la línea donde se exporta db, agregar:
// Initialize Analytics (solo en el cliente y si está soportado)
let analytics: any = null
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
        console.log("Firebase Analytics initialized successfully")
      } else {
        console.log("Firebase Analytics not supported in this environment")
      }
    })
    .catch((error) => {
      console.error("Error checking Analytics support:", error)
    })
}

export { analytics }

console.log("Firebase initialized successfully with project:", firebaseConfig.projectId)
