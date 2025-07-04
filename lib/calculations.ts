interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  createdAt: any
  participants?: string[]
}

interface Transfer {
  id: string
  from: string
  to: string
  amount: number
  confirmedAt: any
  confirmedBy: string
}

interface Settlement {
  from: string
  to: string
  amount: number
}

interface GroupMember {
  id: string
  name: string
  email: string
  photoURL?: string
}

export function calculateBalances(expenses: Expense[], members: string[]): { [userId: string]: number } {
  const balances: { [userId: string]: number } = {}

  // Initialize balances
  members.forEach((member) => {
    balances[member] = 0
  })

  expenses.forEach((expense) => {
    const participants = expense.participants || members
    const amountPerPerson = expense.amount / participants.length

    // The person who paid gets credited
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount

    // All participants get debited
    participants.forEach((participant) => {
      balances[participant] = (balances[participant] || 0) - amountPerPerson
    })
  })

  return balances
}

export function calculateBalancesWithTransfers(
  members: string[],
  expenses: Expense[],
  transfers: Transfer[],
): { [userId: string]: number } {
  const balances = calculateBalances(expenses, members)

  // Apply transfers
  transfers.forEach((transfer) => {
    balances[transfer.from] = (balances[transfer.from] || 0) + transfer.amount
    balances[transfer.to] = (balances[transfer.to] || 0) - transfer.amount
  })

  return balances
}

export function calculateGroupBalances(
  members: string[],
  expenses: Expense[],
  transfers: Transfer[] = [],
): {
  balances: { [userId: string]: number }
  settlements: Settlement[]
  totalExpenses: number
} {
  const balances = calculateBalancesWithTransfers(members, expenses, transfers)
  const settlements = efficientTransfers(balances)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return {
    balances,
    settlements,
    totalExpenses,
  }
}

export function efficientTransfers(balances: { [userId: string]: number }): Settlement[] {
  const settlements: Settlement[] = []
  const debtors: { userId: string; amount: number }[] = []
  const creditors: { userId: string; amount: number }[] = []

  // Separate debtors and creditors
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance < -0.01) {
      // Small threshold for floating point precision
      debtors.push({ userId, amount: Math.abs(balance) })
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance })
    }
  })

  // Sort by amount (largest first)
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  let i = 0,
    j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      // Only create settlement if amount is significant
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return settlements
}

export function getUserDisplayName(userId: string, usersData: any): string {
  if (usersData && usersData[userId]) {
    return usersData[userId].displayName || usersData[userId].name || usersData[userId].email || userId.slice(0, 6)
  }
  return userId.slice(0, 6)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("ARS", "$")
}

// Nueva función para formatear números sin símbolo de moneda
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function splitExpenseEqually(amount: number, participants: string[]): { [userId: string]: number } {
  const amountPerPerson = amount / participants.length
  const splits: { [userId: string]: number } = {}

  participants.forEach((participant) => {
    splits[participant] = amountPerPerson
  })

  return splits
}

export function calculateUserBalance(userId: string, expenses: Expense[], transfers: Transfer[] = []): number {
  let balance = 0

  expenses.forEach((expense) => {
    const participants = expense.participants || []
    if (participants.length === 0) return

    const amountPerPerson = expense.amount / participants.length

    // If user paid, they get credited
    if (expense.paidBy === userId) {
      balance += expense.amount
    }

    // If user participated, they get debited
    if (participants.includes(userId)) {
      balance -= amountPerPerson
    }
  })

  // Apply transfers
  transfers.forEach((transfer) => {
    if (transfer.from === userId) {
      balance += transfer.amount
    }
    if (transfer.to === userId) {
      balance -= transfer.amount
    }
  })

  return Math.round(balance * 100) / 100
}
