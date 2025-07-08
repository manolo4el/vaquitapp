const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para usuarios
    match /users/{userId} {
      // Los usuarios pueden leer y escribir solo su propio documento
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Permitir leer datos básicos de otros usuarios para mostrar nombres/fotos
      allow read: if request.auth != null;
    }
    
    // Reglas para grupos
    match /groups/{groupId} {
      // Cualquier usuario autenticado puede leer grupos (para invitaciones)
      allow read: if request.auth != null;
      
      // Crear: cualquier usuario autenticado puede crear grupos
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      
      // Actualizar: cualquier usuario puede unirse al grupo o los miembros pueden actualizar
      allow update: if request.auth != null;
      
      // Eliminar: solo el creador puede eliminar
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      
      // Subcolecciones del grupo
      match /expenses/{expenseId} {
        // Cualquier usuario autenticado puede leer gastos
        allow read: if request.auth != null;
        
        // Cualquier usuario autenticado puede crear gastos
        allow create: if request.auth != null;
        
        // Actualizar: solo quien pagó puede actualizar
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.paidBy;
        
        // Eliminar: solo quien pagó puede eliminar
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.paidBy;
      }
      
      match /transfers/{transferId} {
        // Cualquier usuario autenticado puede leer transferencias
        allow read: if request.auth != null;
        
        // Cualquier usuario autenticado puede crear transferencias
        allow create: if request.auth != null;
        
        // Actualizar: cualquier usuario puede actualizar transferencias
        allow update: if request.auth != null;
      }
      
      match /messages/{messageId} {
        // Cualquier usuario autenticado puede leer mensajes
        allow read: if request.auth != null;
        
        // Crear: cualquier usuario autenticado puede enviar mensajes
        allow create: if request.auth != null && 
          request.auth.uid == resource.data.senderId;
        
        // No se permite actualizar o eliminar mensajes
        allow update, delete: if false;
      }
    }
    
    // Reglas para notificaciones
    match /notifications/{notificationId} {
      // Solo el destinatario puede leer sus notificaciones
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Solo el sistema puede crear notificaciones (a través de Cloud Functions)
      allow create: if request.auth != null;
      
      // Solo el destinatario puede marcar como leída o eliminar
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Reglas para amistades
    match /friendships/{friendshipId} {
      // Los usuarios pueden leer amistades donde participan
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.user1 || 
         request.auth.uid == resource.data.user2);
      
      // Los usuarios pueden crear solicitudes de amistad
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.user1;
      
      // Los usuarios pueden actualizar el estado de amistades donde participan
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.user1 || 
         request.auth.uid == resource.data.user2);
      
      // Los usuarios pueden eliminar amistades donde participan
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.user1 || 
         request.auth.uid == resource.data.user2);
    }
  }
}
`

// Función para aplicar las reglas
async function applyFirestoreRules() {
  console.log("Aplicando reglas de Firestore...")
  console.log(firestoreRules)
  console.log("\nCopia estas reglas en la consola de Firebase -> Firestore Database -> Rules")
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyFirestoreRules()
}

module.exports = { firestoreRules, applyFirestoreRules }
