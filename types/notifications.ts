export interface Notification {
  id: string
  userId: string
  type: "expense_added" | "added_to_group" | "debt_paid"
  title: string
  message: string
  groupId: string
  groupName: string
  createdAt: Date
  read: boolean
  expenseId?: string
  amount?: number
  paidBy?: string
  paidTo?: string
}

export interface CreateNotificationData {
  userId: string
  type: "expense_added" | "added_to_group" | "debt_paid"
  title: string
  message: string
  groupId: string
  groupName: string
  expenseId?: string
  amount?: number
  paidBy?: string
  paidTo?: string
}
