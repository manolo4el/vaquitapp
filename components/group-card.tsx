"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore"
import { calculateBalances } from "@/lib/calculations"
import { Users, TrendingUp, TrendingDown } from "lucide-react"
import { GroupDetails } from "./group-details"

interface Group {
  id: string
  name: string
  members: string[]
  createdBy: string
  createdAt: Date
}

interface GroupCardProps {
  group: Group
}

export function GroupCard({ group }: GroupCardProps) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "groups", group.id, "expenses"), (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    // Cargar datos de usuarios
    if (group.members && group.members.length > 0) {
      Promise.all(group.members.map((uid) => getDoc(doc(db, "users", uid)))).then((snaps) => {
        const data: any = {}
        snaps.forEach((snap) => {
          if (snap.exists()) data[snap.id] = snap.data()
        })
        setUsersData(data)
      })
    }

    return unsubscribe
  }, [group.id, group.members])

  const balances = calculateBalances(group.members, expenses)
  const userBalance = balances[user?.uid || ""] || 0
  const youOwe = userBalance < 0 ? -userBalance : 0
  const theyOweYou = userBalance > 0 ? userBalance : 0

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <>
      <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 bg-gradient-to-br from-card to-secondary/5 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl text-primary group-hover:text-primary/80 transition-colors">
              {group.name}
            </CardTitle>
            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border-secondary/30">
              <Users className="h-3 w-3 mr-1" />
              {group.members.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10" onClick={() => setShowDetails(true)}>
          <div className="text-center p-3 bg-gradient-to-r from-muted/50 to-secondary/20 rounded-xl">
            <div className="text-sm text-muted-foreground mb-1">Total del rebaño</div>
            <div className="text-2xl font-bold text-primary">${totalExpenses.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
              <div className="flex items-center justify-center text-accent-foreground mb-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Te deben</span>
              </div>
              <div className="text-xl font-bold text-accent-foreground">${theyOweYou.toFixed(2)}</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-center justify-center text-destructive mb-2">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Debes</span>
              </div>
              <div className="text-xl font-bold text-destructive">${youOwe.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GroupDetails
        group={group}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        expenses={expenses}
        usersData={usersData}
        balances={balances}
      />
    </>
  )
}
