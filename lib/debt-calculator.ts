import { getUserGroups } from "./group-storage"
import { calculateExpensesAndTransfers } from "./expense-calculator"
import { getCurrentUser } from "./auth"

export interface ConsolidatedDebt {
  creditorId: string
  creditorName: string
  creditorAvatar?: string
  creditorAlias?: string
  totalAmount: number
  groups: Array<{
    groupId: string
    groupName: string
    amount: number
  }>
}

export interface ConsolidatedCredit {
  debtorId: string
  debtorName: string
  debtorAvatar?: string
  totalAmount: number
  groups: Array<{
    groupId: string
    groupName: string
    amount: number
  }>
}

/**
 * Calcula las deudas consolidadas del usuario actual
 * Agrupa por acreedor todas las deudas de diferentes grupos
 */
export function getConsolidatedDebts(): {
  debts: ConsolidatedDebt[]
  credits: ConsolidatedCredit[]
  totalOwed: number
  totalOwing: number
} {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    return { debts: [], credits: [], totalOwed: 0, totalOwing: 0 }
  }

  const userGroups = getUserGroups()
  const consolidatedDebts: { [creditorId: string]: ConsolidatedDebt } = {}
  const consolidatedCredits: { [debtorId: string]: ConsolidatedCredit } = {}

  // Procesar cada grupo
  userGroups.forEach((group) => {
    const calculations = calculateExpensesAndTransfers(group.expenses, group.members)

    // Procesar transferencias donde el usuario actual debe dinero
    calculations.transfers.forEach((transfer) => {
      if (transfer.from.id === currentUser.id) {
        // El usuario actual debe dinero
        const creditorId = transfer.to.id
        const creditor = group.members.find((m) => m.id === creditorId)

        if (!creditor) return

        if (!consolidatedDebts[creditorId]) {
          consolidatedDebts[creditorId] = {
            creditorId,
            creditorName: creditor.name,
            creditorAvatar: creditor.avatar,
            creditorAlias: creditor.alias,
            totalAmount: 0,
            groups: [],
          }
        }

        consolidatedDebts[creditorId].totalAmount += transfer.amount
        consolidatedDebts[creditorId].groups.push({
          groupId: group.id,
          groupName: group.name,
          amount: transfer.amount,
        })
      } else if (transfer.to.id === currentUser.id) {
        // Le deben dinero al usuario actual
        const debtorId = transfer.from.id
        const debtor = group.members.find((m) => m.id === debtorId)

        if (!debtor) return

        if (!consolidatedCredits[debtorId]) {
          consolidatedCredits[debtorId] = {
            debtorId,
            debtorName: debtor.name,
            debtorAvatar: debtor.avatar,
            totalAmount: 0,
            groups: [],
          }
        }

        consolidatedCredits[debtorId].totalAmount += transfer.amount
        consolidatedCredits[debtorId].groups.push({
          groupId: group.id,
          groupName: group.name,
          amount: transfer.amount,
        })
      }
    })
  })

  const debts = Object.values(consolidatedDebts)
  const credits = Object.values(consolidatedCredits)

  const totalOwing = debts.reduce((sum, debt) => sum + debt.totalAmount, 0)
  const totalOwed = credits.reduce((sum, credit) => sum + credit.totalAmount, 0)

  return {
    debts,
    credits,
    totalOwed,
    totalOwing,
  }
}

/**
 * Convierte deudas consolidadas al formato esperado por los modales
 */
export function formatDebtsForModal(debts: ConsolidatedDebt[]) {
  return debts.flatMap((debt) =>
    debt.groups.map((group) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      creditor: {
        id: debt.creditorId,
        name: debt.creditorName,
        avatar: debt.creditorAvatar,
        alias: debt.creditorAlias,
      },
      amount: group.amount,
    })),
  )
}

/**
 * Convierte créditos consolidados al formato esperado por los modales
 */
export function formatCreditsForModal(credits: ConsolidatedCredit[]) {
  return credits.flatMap((credit) =>
    credit.groups.map((group) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      debtor: {
        id: credit.debtorId,
        name: credit.debtorName,
        avatar: credit.debtorAvatar,
      },
      amount: group.amount,
    })),
  )
}
