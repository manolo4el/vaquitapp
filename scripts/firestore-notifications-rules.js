#!/usr/bin/env node

console.log(`
🔔 FIRESTORE SECURITY RULES COMPLETAS
====================================

Copia estas reglas COMPLETAS en Firebase Console:
🔗 https://console.firebase.google.com/project/YOUR_PROJECT/firestore/rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;
    }
    
    // Expenses collection
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
    }
    
    // Friends collection
    match /friends/{friendId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.friendId);
      allow create: if request.auth != null && 
        (request.auth.uid == request.resource.data.userId || request.auth.uid == request.resource.data.friendId);
    }
    
    // Messages collection (for group chat)
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
    }
    
    // 🔔 NOTIFICATIONS COLLECTION - NUEVAS REGLAS
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications (mark as read)
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Only authenticated users can create notifications
      allow create: if request.auth != null 
        && request.resource.data.keys().hasAll(['userId', 'type', 'title', 'message', 'groupId', 'groupName', 'createdAt', 'read'])
        && request.resource.data.userId is string
        && request.resource.data.type in ['expense_added', 'added_to_group', 'debt_paid']
        && request.resource.data.title is string
        && request.resource.data.message is string
        && request.resource.data.groupId is string
        && request.resource.data.groupName is string
        && request.resource.data.createdAt is timestamp
        && request.resource.data.read is bool;
    }
  }
}

📊 FIRESTORE INDEXES NECESARIOS
===============================

Ve a: Firebase Console > Firestore Database > Indexes > Create Index

ÍNDICE 1 - Para Notificaciones:
- Collection ID: notifications
- Fields:
  * userId (Ascending)
  * createdAt (Descending)
- Query scope: Collection

ÍNDICE 2 - Para Gastos por Grupo:
- Collection ID: expenses  
- Fields:
  * groupId (Ascending)
  * createdAt (Descending)
- Query scope: Collection

ÍNDICE 3 - Para Mensajes por Grupo:
- Collection ID: messages
- Fields:
  * groupId (Ascending)
  * createdAt (Ascending)
- Query scope: Collection

O ALTERNATIVAMENTE, crea un archivo firestore.indexes.json:
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION", 
      "fields": [
        {
          "fieldPath": "groupId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "groupId", 
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}

Y ejecuta: firebase deploy --only firestore:indexes

🚀 PASOS PARA APLICAR:
=====================
1. Ve a Firebase Console
2. Firestore Database > Rules
3. Reemplaza TODO el contenido con las reglas de arriba
4. Click "Publish"
5. Ve a Indexes
6. Crea los 3 índices manualmente O usa el archivo JSON
7. Espera a que se construyan los índices (puede tomar unos minutos)

====================================
`)
