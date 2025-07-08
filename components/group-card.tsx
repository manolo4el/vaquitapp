"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, getUserDisplayName } from "@/lib/calculations"
import Image from "next/image"

interface Group {
  id: string
  name: string
  members: string[]
  createdAt: any
  createdBy: string
}

interface GroupCardProps {
  group: Group
  userBalance: number
  totalExpenses: number
  usersData: { [key: string]: any }
  onClick: () => void
}

export function GroupCard({ group, userBalance, totalExpenses, usersData, onClick }: GroupCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-card to-muted/20 hover:from-card hover:to-primary/5"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-primary truncate">{group.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              <span>{group.members.length} miembros</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {userBalance > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : userBalance < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-600" />
              ) : null}
              <span
                className={`text-sm font-bold ${
                  userBalance > 0 ? "text-green-600" : userBalance < 0 ? "text-red-600" : "text-primary"
                }`}
              >
                {userBalance > 0 ? "+" : ""}
                {formatCurrency(userBalance)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {userBalance > 0 ? "Te deben" : userBalance < 0 ? "Debes" : "Al día"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members.slice(0, 3).map((memberId) => {
              const userData = usersData[memberId]
              return (
                <div key={memberId} className="relative">
                  {userData?.photoURL ? (
                    <Image
                      src={userData.photoURL || "/placeholder.svg"}
                      alt={getUserDisplayName(memberId, usersData)}
                      width={24}
                      height={24}
                      className="rounded-full border-2 border-background"
                    />
                  ) : (
                    <div className="h-6 w-6 bg-primary/20 rounded-full border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {getUserDisplayName(memberId, usersData).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
            {group.members.length > 3 && (
              <div className="h-6 w-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">+{group.members.length - 3}</span>
              </div>
            )}
          </div>

          <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground text-xs">
            {formatCurrency(totalExpenses)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
