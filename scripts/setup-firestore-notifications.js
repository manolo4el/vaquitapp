// Script para configurar las reglas de Firestore para notificaciones
const admin = require("firebase-admin")

// Reglas de Firestore para notificaciones
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas existentes para users, groups, etc.
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /groups/{groupId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
      
      match /transfers/{transferId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
    }
    
    // NUEVAS REGLAS PARA NOTIFICACIONES
    match /notifications/{notificationId} {
      // Solo el usuario propietario puede leer y actualizar sus notificaciones
      allow read, update: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Solo usuarios autenticados pueden crear notificaciones
      allow create: if request.auth != null && request.auth.uid != null;
      
      // No se permite eliminar notificaciones (opcional, puedes cambiar esto)
      allow delete: if false;
    }
  }
}
`

console.log("Reglas de Firestore para notificaciones:")
console.log(firestoreRules)
console.log("\nCopia estas reglas en la consola de Firebase -> Firestore Database -> Rules")
