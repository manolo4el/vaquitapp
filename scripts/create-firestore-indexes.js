console.log(`
🔥 FIRESTORE INDEXES SETUP

Los índices se crean automáticamente cuando haces las primeras consultas.
También puedes crearlos manualmente en Firebase Console:

📍 Ve a: Firebase Console > Firestore Database > Indexes

🔧 CREAR ESTOS 3 ÍNDICES:

1. NOTIFICATIONS INDEX:
   - Collection ID: notifications
   - Fields: 
     * userId (Ascending)
     * createdAt (Descending)

2. EXPENSES INDEX:
   - Collection ID: expenses  
   - Fields:
     * groupId (Ascending) 
     * createdAt (Descending)

3. MESSAGES INDEX:
   - Collection ID: messages
   - Fields:
     * groupId (Ascending)
     * createdAt (Ascending)

⚡ Los índices se construirán automáticamente cuando uses la app.
⏳ Puede tomar unos minutos en completarse.

✅ Una vez listos, las notificaciones funcionarán perfectamente!
`)
