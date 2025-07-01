// Mock Firebase configuration to avoid initialization errors
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
}

// Mock database object
export const db = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
    add: () => Promise.resolve({ id: "mock-id" }),
    where: () => ({
      get: () => Promise.resolve({ docs: [] }),
    }),
  }),
}

// Mock auth object
export const auth = {
  currentUser: null,
  signInWithPopup: () => Promise.resolve({ user: { uid: "mock-uid", email: "mock@email.com" } }),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: (callback: any) => {
    // Mock auth state
    setTimeout(() => callback(null), 100)
    return () => {}
  },
}

export default { db, auth }
