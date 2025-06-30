export interface Group {
  id: string
  name: string
  description?: string
  members: GroupMember[]
  expenses: Expense[]
  inviteCode: string
  createdAt: Date
  createdBy: string
}

export interface GroupMember {
  id: string
  name: string
  email: string
  avatar?: string
  alias?: string
  joinedAt: Date
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: Date
  category?: string
  receipt?: string
}

export interface DebtSummary {
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
    if (!stored) return []

    const groups = JSON.parse(stored)
    // Convertir fechas de string a Date
    return groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      members: group.members.map((member: any) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
      })),
      expenses: group.expenses.map((expense: any) => ({
        ...expense,
        date: new Date(expense.date),
      })),
    }))
  } catch (error) {
    console.error("Error al obtener grupos:", error)
    return []
  }
}

// Función para guardar grupos
function saveGroups(groups: Group[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error("Error al guardar grupos:", error)
  }
}

// Función para obtener un grupo por ID
export function getGroupById(id: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.id === id) || null
}

// Función para obtener un grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.inviteCode === inviteCode.toUpperCase()) || null
}

// Función para crear un nuevo grupo
export function createGroup(name: string, description: string, createdBy: string): Group {
  const groups = getGroups()
  const inviteCode = generateInviteCode()

  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    members: [],
    expenses: [],
    inviteCode,
    createdAt: new Date(),
    createdBy,
  }

  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Omit<GroupMember, "joinedAt">): Group | null {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const group = groups[groupIndex]

  // Verificar si el miembro ya existe
  const existingMember = group.members.find((m) => m.id === member.id)
  if (existingMember) return group

  // Agregar el nuevo miembro
  const newMember: GroupMember = {
    ...member,
    joinedAt: new Date(),
  }

  group.members.push(newMember)
  groups[groupIndex] = group
  saveGroups(groups)

  return group
}

// Función para agregar un gasto
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id" | "date">): Group | null {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return null

  const group = groups[groupIndex]

  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    date: new Date(),
  }

  group.expenses.push(newExpense)
  groups[groupIndex] = group
  saveGroups(groups)

  return group
}

// Función para calcular deudas
export function calculateDebts(group: Group): DebtSummary[] {
  const balances: Record<string, number> = {}

  // Inicializar balances
  group.members.forEach((member) => {
    balances[member.id] = 0
  })

  // Calcular balances basado en gastos
  group.expenses.forEach((expense) => {
    const splitAmount = expense.amount / expense.splitBetween.length

    // El que pagó recibe crédito
    balances[expense.paidBy] += expense.amount

    // Los que deben pagar pierden crédito
    expense.splitBetween.forEach((memberId) => {
      balances[memberId] -= splitAmount
    })
  })

  // Convertir balances a deudas
  const debts: DebtSummary[] = []
  const creditors = Object.entries(balances).filter(([, balance]) => balance > 0.01)
  const debtors = Object.entries(balances).filter(([, balance]) => balance < 0)

  creditors.forEach(([creditorId, creditAmount]) => {
    debtors.forEach(([debtorId, debtAmount]) => {
      if (Math.abs(debtAmount) > 0.01 && creditAmount > 0.01) {
        const transferAmount = Math.min(creditAmount, Math.abs(debtAmount))

        debts.push({
          from: debtorId,
          to: creditorId,
          amount: transferAmount,
        })

        // Actualizar balances
        balances[creditorId] -= transferAmount
        balances[debtorId] += transferAmount
      }
    })
  })

  return debts.filter((debt) => debt.amount > 0.01)
}

// Función para generar ID único
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Función para generar código de invitación
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Función para obtener grupos del usuario
export function getUserGroups(userId: string): Group[] {
  const groups = getGroups()
  return groups.filter((group) => group.members.some((member) => member.id === userId) || group.createdBy === userId)
}
