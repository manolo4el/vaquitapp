const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }

    // Reglas para grupos
    match /groups/{groupId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;
      
      // Reglas para gastos dentro de grupos
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
      
      // Reglas para transferencias dentro de grupos
      match /transfers/{transferId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
      
      // Reglas para chat dentro de grupos
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
    }

    // Reglas para invitaciones
    match /invitations/{invitationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.createdBy;
      allow update: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }

    // Reglas para notificaciones
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }

    // Reglas para amigos
    match /friendships/{friendshipId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.user1 || request.auth.uid == resource.data.user2);
      allow create: if request.auth != null && 
        (request.auth.uid == request.resource.data.user1 || request.auth.uid == request.resource.data.user2);
    }

    // Reglas para solicitudes de amistad
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.from || request.auth.uid == resource.data.to);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.from;
    }
  }
}
`

console.log("Firestore Security Rules:")
console.log(firestoreRules)

// Para aplicar estas reg las, copia el contenido de arriba y pégalo en:
// Firebase Console > Firestore Database > Rules
console.log("\n📋 Para aplicar estas reglas:")
console.log("1. Ve a Firebase Console > Firestore Database > Rules")
console.log("2. Copia y pega el contenido de arriba")
console.log("3. Haz clic en 'Publicar'")
