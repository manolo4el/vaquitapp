// Script para configurar las reglas de Firestore para producción
// Copia y pega estas reglas en Firebase Console > Firestore Database > Rules

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para usuarios - solo pueden escribir su propio perfil, pero leer otros perfiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reglas para grupos - solo miembros pueden acceder
    match /groups/{groupId} {
      // Leer: solo miembros del grupo
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      
      // Crear: el creador debe incluirse en los miembros
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Actualizar: solo miembros pueden actualizar
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.members;
      
      // Eliminar: solo el creador puede eliminar el grupo
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      
      // Reglas para gastos dentro de grupos
      match /expenses/{expenseId} {
        // Leer: solo miembros del grupo
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        
        // Crear: solo miembros pueden crear gastos
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.resource.data.paidBy == request.auth.uid;
        
        // Actualizar: solo quien pagó puede actualizar el gasto
        allow update: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.auth.uid == resource.data.paidBy;
        
        // Eliminar: solo quien pagó puede eliminar el gasto
        allow delete: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.auth.uid == resource.data.paidBy;
      }
      
      // Reglas para mensajes dentro de grupos - NUEVAS
      match /messages/{messageId} {
        // Leer: solo miembros del grupo
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        
        // Crear: solo miembros pueden crear mensajes y deben ser el autor
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.resource.data.userId == request.auth.uid;
        
        // Actualizar: solo el autor puede actualizar su mensaje
        allow update: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.auth.uid == resource.data.userId;
        
        // Eliminar: solo el autor puede eliminar su mensaje
        allow delete: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.auth.uid == resource.data.userId;
      }
      
      // Reglas para transferencias dentro de grupos
      match /transfers/{transferId} {
        // Leer: solo miembros del grupo
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        
        // Crear: solo quien debe pagar puede crear la transferencia
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.resource.data.from == request.auth.uid;
        
        // Actualizar: solo quien recibe puede confirmar la transferencia
        allow update: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          (request.auth.uid == resource.data.to || request.auth.uid == resource.data.from);
        
        // Eliminar: solo quien creó puede eliminar si no está confirmada
        allow delete: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members &&
          request.auth.uid == resource.data.from &&
          resource.data.status != 'confirmed';
      }
    }
    
    // Reglas para invitaciones - más restrictivas
    match /invitations/{invitationId} {
      // Leer: solo el invitado o quien invita
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.invitedUserId || 
         request.auth.uid == resource.data.invitedBy);
      
      // Crear: cualquier usuario autenticado puede crear invitaciones
      allow create: if request.auth != null && 
        request.resource.data.invitedBy == request.auth.uid;
      
      // Actualizar: solo el invitado puede actualizar (aceptar/rechazar)
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.invitedUserId;
      
      // Eliminar: solo quien invitó puede eliminar
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.invitedBy;
    }
  }
}
`

console.log("Reglas de Firestore para producción:")
console.log(firestoreRules)

// Para usar este script:
// 1. Ve a Firebase Console
// 2. Selecciona tu proyecto
// 3. Ve a Firestore Database > Rules
//
// 1. Ve a Firebase Console
// 2. Selecciona tu proyecto
// 3. Ve a Firestore Database > Rules
// 4. Copia y pega las reglas de arriba
// 5. Haz clic en "Publicar"

export default firestoreRules
