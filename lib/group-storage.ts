export interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: string
  category?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  members: Member[]
  expenses: Expense[]
  createdAt: string
  createdBy: string
  inviteCode: string
}

export interface Debt {
  from: string
  to: string
  amount: number
}

const GROUPS_STORAGE_KEY = "amigo-gastos-groups"

// Función para obtener todos los grupos
export function getGroups(): Group[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error al obtener grupos:", error)
    return []
  }
}

// Función para guardar grupos
export function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error al guardar grupos:", error)
  }
}

// Función para obtener un grupo por ID
export function getGroup(id: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.id === id) || null
}

// Función para crear un nuevo grupo
export function createGroup(name: string, description: string, createdBy: string): Group {
  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    members: [],
    expenses: [],
    createdAt: new Date().toISOString(),
    createdBy,
    inviteCode: generateInviteCode(),
  }

  const groups = getGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para actualizar un grupo
export function updateGroup(updatedGroup: Group): void {
  const groups = getGroups()
  const index = groups.findIndex((group) => group.id === updatedGroup.id)

  if (index !== -1) {
    groups[index] = updatedGroup
    saveGroups(groups)
  }
}

// Función para eliminar un grupo
export function deleteGroup(id: string): void {
  const groups = getGroups()
  const filteredGroups = groups.filter((group) => group.id !== id)
  saveGroups(filteredGroups)
}

// Función para generar ID único
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Función para generar código de invitación
function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

// Función para encontrar grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

// Función para agregar miembro a un grupo
export function addMemberToGroup(groupId: string, member: Member): boolean {
  const group = getGroup(groupId)
  if (!group) return false

  // Verificar si el miembro ya existe
  const existingMember = group.members.find((m) => m.id === member.id)
  if (existingMember) return false

  group.members.push(member)
  updateGroup(group)
  return true
}

// Función para agregar gasto a un grupo
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): boolean {
  const group = getGroup(groupId)
  if (!group) return false

  const newExpense: Expense = {
    ...expense,
    id: generateId(),
  }

  group.expenses.push(newExpense)
  updateGroup(group)
  return true
}

// Función para calcular deudas de un grupo
export function calculateGroupDebts(groupId: string): Debt[] {
  const group = getGroup(groupId)
  if (!group) return []

  // Calcular balance de cada miembro
  const balances: { [memberId: string]: number } = {}

  // Inicializar balances
  group.members.forEach((member) => {
    balances[member.id] = 0
  })

  // Calcular gastos y divisiones
  group.expenses.forEach((expense) => {
    const splitAmount = expense.amount / expense.splitBetween.length

    // El que pagó recibe crédito
    balances[expense.paidBy] += expense.amount

    // Los que participan en la división deben su parte
    expense.splitBetween.forEach((memberId) => {
      balances[memberId] -= splitAmount
    })
  })

  // Convertir balances a deudas
  const debts: Debt[] = []
  const creditors = Object.entries(balances).filter(([_, balance]) => balance > 0.01)
  const debtors = Object.entries(balances).filter(([_, balance]) => balance < -0.01)

  // Algoritmo simple para minimizar transacciones
  creditors.forEach(([creditorId, creditAmount]) => {
    let remainingCredit = creditAmount

    debtors.forEach(([debtorId, debtAmount]) => {
      if (remainingCredit > 0.01 && debtAmount < -0.01) {
        const transferAmount = Math.min(remainingCredit, Math.abs(debtAmount))

        debts.push({
          from: debtorId,
          to: creditorId,
          amount: Math.round(transferAmount * 100) / 100,
        })

        remainingCredit -= transferAmount
        balances[debtorId] += transferAmount
      }
    })
  })

  return debts.filter((debt) => debt.amount > 0.01)
}
