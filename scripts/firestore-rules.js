// Reglas de Firestore para Vaquitapp
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
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;
      allow update: if request.auth != null && request.auth.uid in resource.data.members;
      allow delete: if request.auth != null && request.auth.uid in resource.data.members;
      
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
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.invitedUserId || 
         request.auth.uid == resource.data.invitedBy);
      allow update: if request.auth != null && request.auth.uid == resource.data.invitedUserId;
    }
    
    // Reglas para notificaciones
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Reglas para amigos
    match /friendships/{friendshipId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.friendId);
      allow create: if request.auth != null;
    }
  }
}
`

console.log("Reglas de Firestore para copiar:")
console.log(firestoreRules)
