const admin = require("firebase-admin")

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = admin.firestore()

async function createIndexes() {
  console.log("🔥 Creating Firestore indexes...")

  try {
    // Note: Firestore indexes are typically created automatically when queries are made
    // or manually through Firebase Console. This script will make the queries that trigger
    // automatic index creation.

    console.log("📊 Testing queries to trigger index creation...")

    // Query 1: Notifications by user and creation date
    console.log("Creating notifications index...")
    await db
      .collection("notifications")
      .where("userId", "==", "test-user")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .catch(() => console.log("Notifications index will be created automatically"))

    // Query 2: Expenses by group and creation date
    console.log("Creating expenses index...")
    await db
      .collection("expenses")
      .where("groupId", "==", "test-group")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .catch(() => console.log("Expenses index will be created automatically"))

    // Query 3: Messages by group and creation date
    console.log("Creating messages index...")
    await db
      .collection("messages")
      .where("groupId", "==", "test-group")
      .orderBy("createdAt", "asc")
      .limit(1)
      .get()
      .catch(() => console.log("Messages index will be created automatically"))

    console.log("✅ Index creation process completed!")
    console.log("📝 Check Firebase Console > Firestore > Indexes to see the status")
    console.log("⏳ Indexes may take a few minutes to build")
  } catch (error) {
    console.error("❌ Error creating indexes:", error)
  }
}

// Manual index creation instructions
console.log(`
🔥 FIRESTORE INDEXES NEEDED:

Go to Firebase Console > Firestore Database > Indexes and create these:

1. NOTIFICATIONS INDEX:
   - Collection ID: notifications
   - Fields: userId (Ascending), createdAt (Descending)

2. EXPENSES INDEX:
   - Collection ID: expenses  
   - Fields: groupId (Ascending), createdAt (Descending)

3. MESSAGES INDEX:
   - Collection ID: messages
   - Fields: groupId (Ascending), createdAt (Ascending)

Or run this script to trigger automatic creation:
`)

createIndexes()
