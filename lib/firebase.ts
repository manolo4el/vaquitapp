import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once
let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== "undefined") {
  // Only initialize on client side
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  // Initialize auth and firestore after app is ready
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }
export default app
