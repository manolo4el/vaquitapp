import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

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

console.log("Firebase initialized successfully with project:", firebaseConfig.projectId)
