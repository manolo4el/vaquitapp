export interface Notification {
  id: string
  userId: string
  type: "expense_added" | "added_to_group" | "debt_paid"
  title: string
  message: string
  groupId: string
  groupName: string
  createdBy?: string
  createdByName?: string
  createdAt: Date
  read: boolean
}

export type NotificationType = Notification["type"]
