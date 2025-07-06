// Firestore Security Rules for Notifications
// Copy these rules to your Firebase Console -> Firestore Database -> Rules

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules for other collections...
    
    // Notifications rules
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications (mark as read)
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Only authenticated users can create notifications
      // This will be used by the app to create notifications for other users
      allow create: if request.auth != null 
        && request.resource.data.keys().hasAll(['userId', 'type', 'title', 'message', 'groupId', 'groupName', 'createdAt', 'read'])
        && request.resource.data.type in ['expense_added', 'added_to_group', 'debt_paid']
        && request.resource.data.read == false
        && request.resource.data.createdAt is timestamp;
    }
  }
}
`

console.log("📋 Copy these Firestore Security Rules to Firebase Console:")
console.log("🔗 https://console.firebase.google.com/project/YOUR_PROJECT/firestore/rules")
console.log("\n" + firestoreRules)

// Instructions
console.log("\n📝 Instructions:")
console.log("1. Go to Firebase Console")
console.log("2. Navigate to Firestore Database > Rules")
console.log("3. Add the notifications rules to your existing rules")
console.log("4. Click 'Publish' to apply the changes")
