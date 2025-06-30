import { db } from "./firebase"
import { collection, addDoc, getDocs, query, where, Timestamp, updateDoc, doc, arrayUnion } from "firebase/firestore"
import type { Group } from "./group-storage"
import type { Member } from "./expense-calculator"
import { getAllGroups } from "./group-storage"

// Genera un código de invitación único
async function generateUniqueInviteCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  let exists = true

  while (exists) {
    code = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
    // Verificar unicidad en Firestore
    const q = query(collection(db, "groups"), where("inviteCode", "==", code))
    const snap = await getDocs(q)
    exists = !snap.empty
  }
  return code
}

// Crea un grupo en Firestore
export async function createGroupFirestore(name: string, user: Member): Promise<Group> {
  const inviteCode = await generateUniqueInviteCode()
  const groupData = {
    name: name.trim(),
    members: [user],
    expenses: [],
    createdAt: Timestamp.now(),
    inviteCode,
    transfers: [],
    messages: [],
  }
  const ref = await addDoc(collection(db, "groups"), groupData)
  return { id: ref.id, ...groupData } as Group
}

// Busca un grupo por código de invitación
export async function getGroupByInviteCodeFirestore(code: string): Promise<Group | null> {
  const q = query(collection(db, "groups"), where("inviteCode", "==", code))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as Group
}

// Agrega un miembro a un grupo
export async function addMemberToGroupFirestore(groupId: string, member: Member): Promise<void> {
  const groupRef = doc(db, "groups", groupId)
  await updateDoc(groupRef, {
    members: arrayUnion(member),
  })
}

// Migra todos los grupos de localStorage a Firestore y limpia localStorage
export async function migrateLocalGroupsToFirestore() {
  const localGroups = getAllGroups()
  for (const group of localGroups) {
    // Evitar duplicados: buscar por inviteCode
    const existing = await getGroupByInviteCodeFirestore(group.inviteCode || "")
    if (!existing) {
      // Usar el primer miembro como creador
      const creator = group.members[0]
      await createGroupFirestore(group.name, creator)
      // (Opcional: migrar gastos, transfers, messages si es necesario)
    }
  }
  // Limpiar localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("amigo-gastos-groups")
    localStorage.setItem("amigo-gastos-groups", JSON.stringify([]))
  }
} 