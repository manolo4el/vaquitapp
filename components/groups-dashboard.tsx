"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore"
import { Plus } from "lucide-react"
import { GroupCard } from "./group-card"
import Image from "next/image"

interface Group {
  id: string
  name: string
  members: string[]
  createdBy: string
  createdAt: Date
}

export function GroupsDashboard() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Group,
      )
      setGroups(groupsData)
    })

    return unsubscribe
  }, [user])

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return

    await addDoc(collection(db, "groups"), {
      name: newGroupName,
      members: [user.uid],
      createdBy: user.uid,
      createdAt: new Date(),
    })

    setNewGroupName("")
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mis Rebaños 🐄
          </h2>
          <p className="text-muted-foreground text-lg">Gestiona tus grupos de gastos con estilo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 h-12 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Crear Rebaño
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-sm border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary flex items-center gap-2">🐄 Crear Nuevo Rebaño</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nombre del rebaño (ej: Vacaciones en la playa)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createGroup()}
                className="h-12 border-primary/20 focus:border-primary"
              />
              <Button
                onClick={createGroup}
                className="w-full h-12 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold"
              >
                ✨ Crear Rebaño
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-secondary/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
              <Image src="/cow-logo.svg" alt="Cow" width={80} height={80} className="opacity-60" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3">¡Tu primer rebaño te espera!</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Crea tu primer grupo para comenzar a dividir gastos con tus amigos de la manera más fácil
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold h-12 px-8"
            >
              <Plus className="h-5 w-5 mr-2" />🐄 Crear mi primer rebaño
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
