export interface Expense {
  id: number
  title: string
  amount: number
  paidBy: { id: string; name: string } // Cambiar id a string
  splitBetween: string[] // Cambiar a string array
  date: string
  description?: string
}

export interface Balance {
  userId: string // Cambiar a string
  name: string
  balance: number
  status: "owed" | "owes" | "settled"
}

export interface Transfer {
  from: { id: string; name: string } // Cambiar id a string
  to: { id: string; name: string } // Cambiar id a string
  amount: number
}

export interface Member {
  id: string // Cambiar a string para Firebase UIDs
  name: string
  avatar?: string
  alias?: string
}

/**
 * Calcula balances y optimiza transferencias para gastos compartidos
 */
export function calculateExpensesAndTransfers(expenses: Expense[], members: Member[]) {
  // 1. Calcular balances netos
  const balances: { [userId: string]: number } = {}

  // Inicializar todos los usuarios con balance 0
  members.forEach((member) => {
    balances[member.id] = 0
  })

  // Calcular balances por cada gasto
  expenses.forEach((expense) => {
    const amountPerPerson = expense.amount / expense.splitBetween.length

    // El pagador recibe crédito por el monto total
    balances[expense.paidBy.id] += expense.amount

    // Cada participante debe su parte
    expense.splitBetween.forEach((participantId) => {
      balances[participantId] -= amountPerPerson
    })
  })

  // 2. Convertir a formato Balance con status
  const balancesList: Balance[] = members.map((member) => {
    const balance = Math.round(balances[member.id] * 100) / 100
    let status: "owed" | "owes" | "settled" = "settled"

    if (balance > 0.01) status = "owed"
    else if (balance < -0.01) status = "owes"

    return {
      userId: member.id,
      name: member.name,
      balance,
      status,
    }
  })

  // 3. Optimizar transferencias
  const transfers = optimizeTransfers(balances, members)

  return {
    balances: balancesList,
    transfers,
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
  }
}

/**
 * Optimiza transferencias para minimizar la cantidad de pagos
 */
function optimizeTransfers(balances: { [userId: string]: number }, members: Member[]): Transfer[] {
  const transfers: Transfer[] = []
  const balancesCopy = { ...balances }

  while (true) {
    const debtors: { userId: string; debt: number }[] = []
    const creditors: { userId: string; credit: number }[] = []

    // Clasificar usuarios por su balance
    Object.entries(balancesCopy).forEach(([userId, balance]) => {
      const balanceRounded = Math.round(balance * 100) / 100

      if (balanceRounded < -0.01) {
        debtors.push({ userId, debt: Math.abs(balanceRounded) })
      } else if (balanceRounded > 0.01) {
        creditors.push({ userId, credit: balanceRounded })
      }
    })

    // Si no hay deudores o acreedores, terminamos
    if (debtors.length === 0 || creditors.length === 0) {
      break
    }

    // Ordenar por monto (mayor primero)
    debtors.sort((a, b) => b.debt - a.debt)
    creditors.sort((a, b) => b.credit - a.credit)

    // Conectar el mayor deudor con el mayor acreedor
    const biggestDebtor = debtors[0]
    const biggestCreditor = creditors[0]

    // Calcular monto de transferencia
    const transferAmount = Math.min(biggestDebtor.debt, biggestCreditor.credit)

    // Encontrar nombres de usuarios
    const fromUser = members.find((m) => m.id === biggestDebtor.userId)!
    const toUser = members.find((m) => m.id === biggestCreditor.userId)!

    // Registrar transferencia
    transfers.push({
      from: { id: fromUser.id, name: fromUser.name },
      to: { id: toUser.id, name: toUser.name },
      amount: Math.round(transferAmount * 100) / 100,
    })

    // Actualizar balances
    balancesCopy[biggestDebtor.userId] += transferAmount
    balancesCopy[biggestCreditor.userId] -= transferAmount
  }

  return transfers
}

/**
 * Calcula el balance total de un usuario específico
 */
export function getUserBalance(expenses: Expense[], userId: string): number {
  let balance = 0

  expenses.forEach((expense) => {
    const amountPerPerson = expense.amount / expense.splitBetween.length

    // Si pagó, recibe crédito
    if (expense.paidBy.id === userId) {
      balance += expense.amount
    }

    // Si participó, debe su parte
    if (expense.splitBetween.includes(userId)) {
      balance -= amountPerPerson
    }
  })

  return Math.round(balance * 100) / 100
}

/**
 * Formatea un monto en pesos argentinos
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount)
}
