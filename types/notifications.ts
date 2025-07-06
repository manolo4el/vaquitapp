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
}

export interface NotificationData {
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
}
