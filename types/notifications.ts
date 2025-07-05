export interface Notification {
  id: string
  userId: string
  type: "new_expense" | "added_to_group" | "debt_paid"
  title: string
  message: string
  groupId: string
  groupName: string
  triggerUserId: string
  triggerUserName: string
  isRead: boolean
  createdAt: any
  expenseId?: string
  amount?: number
}

export interface NotificationData {
  type: Notification["type"]
  groupId: string
  groupName: string
  triggerUserId: string
  triggerUserName: string
  expenseId?: string
  amount?: number
  expenseDescription?: string
}
