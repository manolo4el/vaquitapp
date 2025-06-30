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
  inviteCode: string
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
function saveGroups(groups: Group[]): void {
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
export function createGroup(name: string, description?: string): Group {
  const newGroup: Group = {
    id: Date.now().toString(),
    name,
    description,
    members: [],
    expenses: [],
    createdAt: new Date().toISOString(),
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  }

  const groups = getGroups()
  groups.push(newGroup)
  saveGroups(groups)

  return newGroup
}

// Función para agregar un miembro a un grupo
export function addMemberToGroup(groupId: string, member: Member): boolean {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  // Verificar si el miembro ya existe
  const memberExists = groups[groupIndex].members.some((m) => m.id === member.id)
  if (memberExists) return false

  groups[groupIndex].members.push(member)
  saveGroups(groups)

  return true
}

// Función para agregar un gasto a un grupo
export function addExpenseToGroup(groupId: string, expense: Omit<Expense, "id">): boolean {
  const groups = getGroups()
  const groupIndex = groups.findIndex((group) => group.id === groupId)

  if (groupIndex === -1) return false

  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
  }

  groups[groupIndex].expenses.push(newExpense)
  saveGroups(groups)

  return true
}

// Función para obtener un grupo por código de invitación
export function getGroupByInviteCode(inviteCode: string): Group | null {
  const groups = getGroups()
  return groups.find((group) => group.inviteCode === inviteCode) || null
}

// Función para calcular deudas
export function calculateDebts(group: Group): Array<{ from: string; to: string; amount: number }> {
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

  // Calcular deudas
  const debts: Array<{ from: string; to: string; amount: number }> = []
  const creditors = Object.entries(balances).filter(([, balance]) => balance > 0)
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
