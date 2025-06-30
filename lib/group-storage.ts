export interface Member {
  id: string
  name: string
  avatar?: string
  alias?: string
}

export interface Expense {
  id: number
  title: string
  amount: number
  paidBy: { id: string; name: string }
  splitBetween: string[]
  date: string
  description?: string
}

export interface Group {
  id: string
  name: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  inviteCode?: string
  transfers?: Transfer[]
  messages?: GroupMessage[]
}

export interface Transfer {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  markedAt: string
  markedBy: string
}

export interface GroupMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  groupId: string
}

// Clave para localStorage
const STORAGE_KEY = "amigo-gastos-groups"

// Inicializar localStorage vacío si no existe
if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
}

export function getAllGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error al cargar grupos:", error)
    return []
  }
}

export function getGroupById(id: string): Group | null {
  if (typeof window === "undefined") return null

  try {
    const groups = getAllGroups()
    console.log("Buscando grupo con ID:", id)
    console.log(
      "Grupos disponibles:",
      groups.map((g) => ({ id: g.id, name: g.name })),
    )

    const group = groups.find((group: Group) => group.id === id)
    console.log("Grupo encontrado:", group ? group.name : "No encontrado")

    return group || null
  } catch (error) {
    console.error("Error al cargar grupo:", error)
    return null
  }
}

function saveGroup(group: Group): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === group.id)

  if (groupIndex !== -1) {
    groups[groupIndex] = group
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }
}

export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): Expense {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  // Generar ID único para el gasto
  const newExpense: Expense = {
    ...expense,
    id: Date.now(),
  }

  // Agregar el gasto al grupo
  groups[groupIndex].expenses.push(newExpense)

  // Guardar en localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  return newExpense
}

export function createGroup(name: string): Group {
  const groups = getAllGroups()

  // Simular usuario actual para evitar dependencia circular
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
    avatar: undefined,
    alias: "",
  }

  const inviteCode = generateInviteCode()
  console.log("Generando grupo con código de invitación:", inviteCode)

  const newGroup: Group = {
    id: Date.now().toString(),
    name: name.trim(),
    members: [currentUser],
    expenses: [],
    createdAt: new Date().toISOString(),
    inviteCode: inviteCode,
    transfers: [],
    messages: [],
  }

  groups.push(newGroup)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  console.log("Grupo creado y guardado:", { id: newGroup.id, name: newGroup.name, inviteCode: newGroup.inviteCode })

  return newGroup
}

export function addMemberToGroup(groupId: string, member: Member): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  // Verificar que el miembro no esté ya en el grupo
  const memberExists = groups[groupIndex].members.some((m) => m.id === member.id)
  if (!memberExists) {
    groups[groupIndex].members.push(member)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }
}

export function markTransferAsCompleted(groupId: string, fromUserId: string, toUserId: string, amount: number): void {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  // Simular usuario actual
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
  }

  // Crear registro de transferencia
  const transfer: Transfer = {
    id: Date.now().toString(),
    fromUserId,
    toUserId,
    amount,
    markedAt: new Date().toISOString(),
    markedBy: currentUser.id,
  }

  // Agregar transferencia al grupo
  if (!groups[groupIndex].transfers) {
    groups[groupIndex].transfers = []
  }
  groups[groupIndex].transfers!.push(transfer)

  // Crear un gasto de ajuste para reflejar la transferencia
  const fromUser = groups[groupIndex].members.find((m) => m.id === fromUserId)
  const toUser = groups[groupIndex].members.find((m) => m.id === toUserId)

  if (fromUser && toUser) {
    const adjustmentExpense: Expense = {
      id: Date.now() + 1,
      title: `Transferencia: ${fromUser.name} → ${toUser.name}`,
      amount: amount,
      paidBy: { id: fromUserId, name: fromUser.name },
      splitBetween: [toUserId],
      date: new Date().toISOString(),
      description: `Transferencia marcada como completada`,
    }

    groups[groupIndex].expenses.push(adjustmentExpense)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

export async function markMultiGroupTransferAsCompleted(
  groupIds: string[],
  creditorId: string,
  amounts: number[],
): Promise<void> {
  const groups = getAllGroups()

  // Simular usuario actual
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
  }

  console.log("Marcando transferencias multi-grupo:", { groupIds, creditorId, amounts })

  // Procesar cada grupo
  for (let i = 0; i < groupIds.length; i++) {
    const groupId = groupIds[i]
    const amount = amounts[i]
    const groupIndex = groups.findIndex((g) => g.id === groupId)

    if (groupIndex === -1) {
      console.warn(`Grupo ${groupId} no encontrado, saltando...`)
      continue
    }

    // Crear registro de transferencia
    const transfer: Transfer = {
      id: `${Date.now()}-${i}`,
      fromUserId: currentUser.id,
      toUserId: creditorId,
      amount,
      markedAt: new Date().toISOString(),
      markedBy: currentUser.id,
    }

    // Agregar transferencia al grupo
    if (!groups[groupIndex].transfers) {
      groups[groupIndex].transfers = []
    }
    groups[groupIndex].transfers!.push(transfer)

    // Encontrar información del acreedor en este grupo
    const creditor = groups[groupIndex].members.find((m) => m.id === creditorId)

    if (creditor) {
      const adjustmentExpense: Expense = {
        id: Date.now() + i + 1,
        title: `Liquidación consolidada: ${currentUser.name} → ${creditor.name}`,
        amount: amount,
        paidBy: { id: currentUser.id, name: currentUser.name },
        splitBetween: [creditorId],
        date: new Date().toISOString(),
        description: `Transferencia consolidada marcada como completada`,
      }

      groups[groupIndex].expenses.push(adjustmentExpense)
    }
  }

  // Guardar todos los cambios
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  console.log("Transferencias multi-grupo completadas exitosamente")
}

export function addMessageToGroup(groupId: string, message: string): GroupMessage {
  const groups = getAllGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex === -1) {
    throw new Error("Grupo no encontrado")
  }

  // Simular usuario actual
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
    avatar: undefined,
  }

  // Verificar que el usuario sea miembro del grupo
  const isMember = groups[groupIndex].members.some((m) => m.id === currentUser.id)
  if (!isMember) {
    throw new Error("No eres miembro de este grupo")
  }

  const newMessage: GroupMessage = {
    id: Date.now().toString(),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    message: message.trim(),
    timestamp: new Date().toISOString(),
    groupId: groupId,
  }

  // Inicializar array de mensajes si no existe
  if (!groups[groupIndex].messages) {
    groups[groupIndex].messages = []
  }

  groups[groupIndex].messages!.push(newMessage)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))

  return newMessage
}

export function getGroupMessages(groupId: string): GroupMessage[] {
  const group = getGroupById(groupId)
  if (!group) return []

  // Simular usuario actual
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
  }

  // Verificar que el usuario sea miembro del grupo
  const isMember = group.members.some((m) => m.id === currentUser.id)
  if (!isMember) return []

  return group.messages || []
}

export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  return group.members.some((m) => m.id === userId)
}

export function getUserGroups(): Group[] {
  // Simular usuario actual
  const currentUser = {
    id: "mock-user-" + Date.now(),
    name: "Usuario Demo",
  }

  const allGroups = getAllGroups()

  // Filtrar solo los grupos donde el usuario es miembro
  return allGroups.filter((group) => group.members.some((member) => member.id === currentUser.id))
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  // Generar código de 8 caracteres
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Verificar que no exista ya este código
  const existingGroups = getAllGroups()
  const codeExists = existingGroups.some((group) => group.inviteCode === result)

  // Si existe, generar uno nuevo recursivamente
  if (codeExists) {
    console.log("Código duplicado encontrado, generando nuevo:", result)
    return generateInviteCode()
  }

  console.log("Código de invitación generado:", result)
  return result
}

export function getGroupByInviteCode(code: string): Group | null {
  const groups = getAllGroups()
  console.log("Buscando grupo con código de invitación:", code)
  console.log(
    "Códigos disponibles:",
    groups.map((g) => g.inviteCode),
  )

  const foundGroup = groups.find((group) => group.inviteCode === code) || null
  console.log("Grupo encontrado por código:", foundGroup ? foundGroup.name : "No encontrado")

  return foundGroup
}

export function clearAllData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  }
}
