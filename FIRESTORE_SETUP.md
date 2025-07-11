# Configuración de Firestore para Vaquitapp

## Reglas de Seguridad

### 1. Copiar las reglas
Copia las reglas del archivo `scripts/firestore-rules.js` y pégalas en Firebase Console.

### 2. Índices necesarios
Firestore creará automáticamente los índices simples, pero es posible que necesites crear índices compuestos para:

#### Para notificaciones:
\`\`\`
Colección: notifications
Campos: userId (Ascending), createdAt (Descending)
\`\`\`

#### Para gastos por grupo:
\`\`\`
Colección: groups/{groupId}/expenses
Campos: createdAt (Descending)
\`\`\`

#### Para transferencias por grupo:
\`\`\`
Colección: groups/{groupId}/transfers
Campos: confirmedAt (Descending)
\`\`\`

### 3. Estructura de datos esperada

#### Usuarios (`/users/{userId}`):
\`\`\`javascript
{
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL: string | null,
  paymentInfo?: string,
  createdAt: timestamp
}
\`\`\`

#### Grupos (`/groups/{groupId}`):
\`\`\`javascript
{
  name: string,
  members: string[], // Array de UIDs
  createdBy: string, // UID del creador
  createdAt: timestamp
}
\`\`\`

#### Gastos (`/groups/{groupId}/expenses/{expenseId}`):
\`\`\`javascript
{
  description: string,
  amount: number,
  paidBy: string, // UID
  participants: string[], // Array de UIDs
  createdAt: timestamp
}
\`\`\`

#### Transferencias (`/groups/{groupId}/transfers/{transferId}`):
\`\`\`javascript
{
  from: string, // UID
  to: string, // UID
  amount: number,
  confirmedAt: timestamp,
  confirmedBy: string // UID
}
\`\`\`

#### Notificaciones (`/notifications/{notificationId}`):
\`\`\`javascript
{
  userId: string, // UID del destinatario
  type: 'new_expense' | 'added_to_group' | 'payment_marked',
  message: string,
  groupId: string,
  createdAt: timestamp
}
\`\`\`

#### Mensajes (`/groups/{groupId}/messages/{messageId}`):
\`\`\`javascript
{
  userId: string, // UID del autor
  message: string,
  timestamp: timestamp
}
\`\`\`

## Permisos por colección

### ✅ Usuarios
- **Leer**: Cualquier usuario autenticado
- **Escribir**: Solo el propio usuario

### ✅ Grupos
- **Leer**: Solo miembros del grupo
- **Crear**: El creador debe incluirse en miembros
- **Actualizar**: Solo miembros (para agregar nuevos miembros)
- **Eliminar**: Solo el creador

### ✅ Gastos
- **Leer**: Solo miembros del grupo
- **Crear**: Solo miembros del grupo
- **Actualizar/Eliminar**: Solo quien pagó el gasto

### ✅ Transferencias
- **Leer**: Solo miembros del grupo
- **Crear**: Solo quien debe pagar
- **Actualizar**: Quien paga o quien recibe
- **Eliminar**: Solo quien creó la transferencia

### ✅ Notificaciones
- **Leer**: Solo el destinatario
- **Crear**: Cualquier usuario autenticado
- **Actualizar/Eliminar**: Solo el destinatario

### ✅ Mensajes
- **Leer**: Solo miembros del grupo
- **Crear**: Solo miembros (y debe ser el autor)
- **Actualizar/Eliminar**: Solo el autor del mensaje

## Comandos útiles

### Verificar reglas:
\`\`\`bash
firebase firestore:rules:get
\`\`\`

### Desplegar reglas:
\`\`\`bash
firebase deploy --only firestore:rules
\`\`\`

### Verificar índices:
\`\`\`bash
firebase firestore:indexes
