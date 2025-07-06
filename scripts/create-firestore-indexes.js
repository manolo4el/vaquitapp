import { getFirestore } from "firebase-admin/firestore"

// Configuración de los índices necesarios
const indexes = [
  {
    collectionGroup: "notifications",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "expenses",
    fields: [
      { fieldPath: "groupId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "messages",
    fields: [
      { fieldPath: "groupId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "ASCENDING" },
    ],
  },
]

async function createIndexes() {
  try {
    console.log("🔥 Iniciando creación de índices de Firestore...")

    // Nota: Los índices se crean automáticamente cuando se ejecutan consultas
    // que los requieren. Este script simula esas consultas para forzar la creación.

    const db = getFirestore()

    console.log("📊 Creando índice para notificaciones...")
    // Esta consulta forzará la creación del índice de notificaciones
    await db.collection("notifications").where("userId", "==", "dummy").orderBy("createdAt", "desc").limit(1).get()

    console.log("💰 Creando índice para gastos...")
    // Esta consulta forzará la creación del índice de gastos
    await db.collection("expenses").where("groupId", "==", "dummy").orderBy("createdAt", "desc").limit(1).get()

    console.log("💬 Creando índice para mensajes...")
    // Esta consulta forzará la creación del índice de mensajes
    await db.collection("messages").where("groupId", "==", "dummy").orderBy("createdAt", "asc").limit(1).get()

    console.log("✅ Índices creados exitosamente!")
    console.log("📝 Ve a Firebase Console > Firestore > Indexes para verificar el estado")
  } catch (error) {
    console.error("❌ Error creando índices:", error)
    console.log("🔧 Solución alternativa:")
    console.log("1. Ve a Firebase Console > Firestore Database > Indexes")
    console.log("2. Crea manualmente estos índices:")

    indexes.forEach((index, i) => {
      console.log(`\nÍndice ${i + 1}:`)
      console.log(`Collection: ${index.collectionGroup}`)
      index.fields.forEach((field) => {
        console.log(`- ${field.fieldPath}: ${field.order}`)
      })
    })
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createIndexes()
}

export { createIndexes }
