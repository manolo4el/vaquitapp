"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { useAnalytics } from "@/hooks/use-analytics"

interface AddExpensePageProps {
  groupId: string
  onNavigate: (page: string, groupId?: string) => void
}

export function AddExpensePage({ groupId, onNavigate }: AddExpensePageProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>({})
  const [expenseTitle, setExpenseTitle] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [paidBy, setPaidBy] = useState(user?.uid || "")
  const [participants, setParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { trackExpenseAction } = useAnalytics()

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return

      const groupDoc = await getDoc(doc(db, "groups", groupId))
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() }
        setGroup(groupData)
        setParticipants(groupData.members) // Por defecto, todos participan

        // Cargar datos de usuarios
        const usersPromises = groupData.members.map((uid: string) => getDoc(doc(db, "users", uid)))
        const usersSnaps = await Promise.all(usersPromises)
        const usersDataMap: any = {}
        usersSnaps.forEach((snap) => {
          if (snap.exists()) {
            usersDataMap[snap.id] = snap.data()
          }
        })
        setUsersData(usersDataMap)
      }
    }

    loadGroupData()
  }, [groupId])

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addExpense = async (addAnother = false) => {
    if (!expenseTitle.trim() || !expenseAmount || participants.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(expenseAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "groups", groupId, "expenses"), {
        description: expenseTitle,
        amount,
        paidBy,
        participants,
        createdAt: new Date(),
      })

      trackExpenseAction("expense_added", amount, groupId, {
        description: expenseTitle,
        participant_count: participants.length,
        paid_by_self: paidBy === user?.uid,
      })

      toast({
        title: "¡Éxito!",
        description: "¡Gasto agregado exitosamente! 🐄",
      })

      if (addAnother) {
