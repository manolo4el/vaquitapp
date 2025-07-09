// Reglas completas de Firestore para Vaquitapp
// Copia y pega estas reglas en Firebase Console > Firestore Database > Rules

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // REGLAS PARA USUARIOS
    // ========================================
    match /users/{userId} {
      // Leer: cualquier usuario autenticado puede leer perfiles de otros usuarios
      allow read: if request.auth != null;
      
      // Escribir: solo el propio usuario puede escribir/actualizar su perfil
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ========================================
    // REGLAS PARA GRUPOS
    // ========================================
    match /groups/{groupId} {
      // Leer: cualquier usuario autenticado puede leer (para permitir acceso con link de invitación)
      allow read: if request.auth != null;
      
      // Crear: el creador debe incluirse en los miembros
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Actualizar: cualquier usuario autenticado puede actualizar (para unirse al grupo)
      allow update: if request.auth != null;
      
      // Eliminar: solo el creador puede eliminar el grupo
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      
      // ========================================
      // REGLAS PARA GASTOS DENTRO DE GRUPOS
      // ========================================
      match /expenses/{expenseId} {
        // Leer: cualquier usuario autenticado puede leer gastos
        allow read: if request.auth != null;
        
        // Crear: cualquier usuario autenticado puede crear gastos
        allow create: if request.auth != null;
        
        // Actualizar: solo quien pagó puede actualizar el gasto
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.paidBy;
        
        // Eliminar: solo quien pagó puede eliminar el gasto
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.paidBy;
      }
      
      // ========================================
      // REGLAS PARA TRANSFERENCIAS DENTRO DE GRUPOS
      // ========================================
      match /transfers/{transferId} {
        // Leer: cualquier usuario autenticado puede leer transferencias
        allow read: if request.auth != null;
        
        // Crear: cualquier usuario autenticado puede crear transferencias
        allow create: if request.auth != null;
        
        // Actualizar: cualquier usuario autenticado puede actualizar transferencias
        allow update: if request.auth != null;
        
        // Eliminar: solo quien creó puede eliminar
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.from;
      }
      
      // ========================================
      // REGLAS PARA MENSAJES DEL CHAT DENTRO DE GRUPOS
      // ========================================
      match /messages/{messageId} {
        // Leer: cualquier usuario autenticado puede leer mensajes
        allow read: if request.auth != null;
        
        // Crear: cualquier usuario autenticado puede crear mensajes y deben ser el autor
        allow create: if request.auth != null && 
          request.resource.data.userId == request.auth.uid;
        
        // Actualizar: solo el autor puede actualizar su mensaje
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.userId;
        
        // Eliminar: solo el autor puede eliminar su mensaje
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.userId;
      }
    }
    
    // ========================================
    // REGLAS PARA NOTIFICACIONES
    // ========================================
    match /notifications/{notificationId} {
      // Leer: solo el usuario destinatario puede leer sus notificaciones
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Crear: cualquier usuario autenticado puede crear notificaciones para otros
      // (esto permite que los triggers funcionen)
      allow create: if request.auth != null;
      
      // Actualizar: solo el destinatario puede actualizar sus notificaciones
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Eliminar: solo el destinatario puede eliminar sus notificaciones
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // ========================================
    // REGLAS PARA INVITACIONES (si las usas)
    // ========================================
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

console.log("=".repeat(60))
console.log("REGLAS DE FIRESTORE PARA VAQUITAPP - ACTUALIZADAS")
console.log("=".repeat(60))
console.log(firestoreRules)
console.log("=".repeat(60))
console.log("CAMBIOS REALIZADOS:")
console.log("✅ Cualquier usuario autenticado puede leer grupos")
console.log("✅ Cualquier usuario autenticado puede actualizar grupos (unirse)")
console.log("✅ Cualquier usuario autenticado puede leer/crear gastos")
console.log("✅ Cualquier usuario autenticado puede leer/crear/actualizar transferencias")
console.log("✅ Cualquier usuario autenticado puede leer mensajes del chat")
console.log("=".repeat(60))
console.log("INSTRUCCIONES:")
console.log("1. Ve a Firebase Console")
console.log("2. Selecciona tu proyecto")
console.log("3. Ve a Firestore Database > Rules")
console.log("4. Copia y pega las reglas de arriba")
console.log("5. Haz clic en 'Publicar'")
console.log("=".repeat(60))

export default firestoreRules
