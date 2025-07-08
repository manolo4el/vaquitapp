// Reglas de Firestore para Vaquitapp
// Ejecutar: node scripts/firestore-rules.js

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regla para usuarios - solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regla para grupos - solo miembros pueden leer/escribir
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.members;
    }
    
    // Regla para gastos dentro de grupos - solo miembros del grupo
    match /groups/{groupId}/expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
    }
    
    // Regla para transferencias dentro de grupos - solo miembros del grupo
    match /groups/{groupId}/transfers/{transferId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
    }
    
    // Regla para mensajes de chat dentro de grupos - solo miembros del grupo
    match /groups/{groupId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
    }
    
    // Regla para notificaciones - solo el usuario propietario
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // NUEVA: Regla para invitaciones - lectura pública, escritura solo para usuarios autenticados
    match /invitations/{invitationId} {
      // Cualquier usuario autenticado puede leer invitaciones (para validar y unirse)
      allow read: if request.auth != null;
      
      // Solo usuarios autenticados pueden crear invitaciones
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.createdBy;
      
      // Solo el creador puede actualizar la invitación (marcar como usada, desactivar)
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         // Permitir que cualquier usuario autenticado marque la invitación como usada
         (request.resource.data.keys().hasOnly(['usedBy']) && 
          request.auth.uid in request.resource.data.usedBy));
      
      // Solo el creador puede eliminar la invitación
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // Regla por defecto - denegar todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`

console.log("=".repeat(80))
console.log("REGLAS DE FIRESTORE PARA VAQUITAPP")
console.log("=".repeat(80))
console.log()
console.log("📋 INSTRUCCIONES:")
console.log("1. Ve a Firebase Console > Firestore Database > Rules")
console.log("2. Copia y pega las siguientes reglas:")
console.log("3. Haz clic en 'Publish' para aplicar los cambios")
console.log()
console.log("🔒 CARACTERÍSTICAS DE SEGURIDAD:")
console.log("• Los usuarios solo pueden acceder a sus propios datos")
console.log("• Solo miembros de grupos pueden ver gastos y transferencias")
console.log("• Las notificaciones son privadas para cada usuario")
console.log("• Las invitaciones pueden ser leídas por usuarios autenticados")
console.log("• Solo el creador puede gestionar sus invitaciones")
console.log()
console.log("=".repeat(80))
console.log("REGLAS DE FIRESTORE:")
console.log("=".repeat(80))
console.log()
console.log(firestoreRules)
console.log()
console.log("=".repeat(80))
console.log("✅ Copia las reglas de arriba y pégalas en Firebase Console")
console.log("=".repeat(80))
