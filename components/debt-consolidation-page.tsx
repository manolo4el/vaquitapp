"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from "firebase/firestore"
import { calculateBalancesWithTransfers, getUserDisplayName, formatAmount } from "@/lib/calculations"
import { ArrowLeft, TrendingUp, TrendingDown, Copy, CreditCard, CheckCircle, Users, Share } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DebtConsolidationPageProps {
  onNavigate: (page: string, groupId?: string) => void
}

interface GroupDebt {
  groupId: string
  groupName: string
  amount: number
  otherUserId: string
  otherUserName: string
  otherUserPaymentInfo?: string
}

interface ConsolidatedDebt {
  otherUserId: string
  otherUserName: string
  otherUserPaymentInfo?: string
  totalAmount: number
  groups: Array<{
    groupId: string
    groupName: string
    amount: number
  }>
}

export function DebtConsolidationPage({ onNavigate }: DebtConsolidationPageProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [debtsToMe, setDebtsToMe] = useState<GroupDebt[]>([])
  const [myDebts, setMyDebts] = useState<GroupDebt[]>([])
  const [consolidatedDebtsToMe, setConsolidatedDebtsToMe] = useState<ConsolidatedDebt[]>([])
  const [consolidatedMyDebts, setConsolidatedMyDebts] = useState<ConsolidatedDebt[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setGroups(groupsData)

      // Cargar datos de todos los usuarios únicos
      const allUserIds = new Set<string>()
      groupsData.forEach((group) => {
        group.members.forEach((uid: string) => allUserIds.add(uid))
      })

      const usersPromises = Array.from(allUserIds).map((uid) => getDoc(doc(db, "users", uid)))
      const usersSnaps = await Promise.all(usersPromises)
      const usersDataMap: any = {}
      usersSnaps.forEach((snap) => {
        if (snap.exists()) {
          usersDataMap[snap.id] = snap.data()
        }
      })
      setUsersData(usersDataMap)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid)
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data())
          } else {
            console.log("No such document!")
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error)
        })
    }
  }, [user])

  useEffect(() => {
    if (!user || groups.length === 0) return

    const unsubscribes: (() => void)[] = []
    const allDebtsToMe: GroupDebt[] = []
    const allMyDebts: GroupDebt[] = []

    const processGroup = (group: any, expenses: any[], transfers: any[]) => {
      const balances = calculateBalancesWithTransfers(group.members, expenses, transfers)

      // Procesar cada miembro del grupo
      group.members.forEach((memberId: string) => {
        if (memberId === user.uid) return // Saltar el usuario actual

        const memberBalance = balances[memberId] || 0
        const userBalance = balances[user.uid] || 0

        // Si el miembro me debe dinero (mi balance es positivo y el suyo negativo)
        if (userBalance > 0 && memberBalance < 0) {
          // Calcular cuánto me debe específicamente este miembro
          const debtAmount = Math.min(userBalance, -memberBalance)
          if (debtAmount > 0.01) {
            allDebtsToMe.push({
              groupId: group.id,
              groupName: group.name,
              amount: debtAmount,
              otherUserId: memberId,
              otherUserName: getUserDisplayName(memberId, usersData),
              otherUserPaymentInfo: usersData[memberId]?.paymentInfo,
            })
          }
        }

        // Si yo le debo dinero al miembro (mi balance es negativo y el suyo positivo)
        if (userBalance < 0 && memberBalance > 0) {
          // Calcular cuánto le debo específicamente a este miembro
          const debtAmount = Math.min(-userBalance, memberBalance)
          if (debtAmount > 0.01) {
            allMyDebts.push({
              groupId: group.id,
              groupName: group.name,
              amount: debtAmount,
              otherUserId: memberId,
              otherUserName: getUserDisplayName(memberId, usersData),
              otherUserPaymentInfo: usersData[memberId]?.paymentInfo,
            })
          }
        }
      })
    }

    let processedGroups = 0
    const totalGroups = groups.length

    groups.forEach((group) => {
      const expensesUnsub = onSnapshot(collection(db, "groups", group.id, "expenses"), (expensesSnapshot) => {
        const expenses = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const transfersUnsub = onSnapshot(collection(db, "groups", group.id, "transfers"), (transfersSnapshot) => {
          const transfers = transfersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          processGroup(group, expenses, transfers)
          processedGroups++

          // Cuando todos los grupos han sido procesados, consolidar las deudas
          if (processedGroups === totalGroups) {
            // Consolidar deudas hacia mí
            const consolidatedToMe = consolidateDebts(allDebtsToMe)
            setConsolidatedDebtsToMe(consolidatedToMe)
            setDebtsToMe(allDebtsToMe)

            // Consolidar mis deudas
            const consolidatedMy = consolidateDebts(allMyDebts)
            setConsolidatedMyDebts(consolidatedMy)
            setMyDebts(allMyDebts)

            // Reset counter for next update
            processedGroups = 0
            allDebtsToMe.length = 0
            allMyDebts.length = 0
          }
        })

        unsubscribes.push(transfersUnsub)
      })

      unsubscribes.push(expensesUnsub)
    })

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [user, groups, usersData])

  const consolidateDebts = (debts: GroupDebt[]): ConsolidatedDebt[] => {
    const consolidated: { [userId: string]: ConsolidatedDebt } = {}

    debts.forEach((debt) => {
      if (!consolidated[debt.otherUserId]) {
        consolidated[debt.otherUserId] = {
          otherUserId: debt.otherUserId,
          otherUserName: debt.otherUserName,
          otherUserPaymentInfo: debt.otherUserPaymentInfo,
          totalAmount: 0,
          groups: [],
        }
      }

      consolidated[debt.otherUserId].totalAmount += debt.amount
      consolidated[debt.otherUserId].groups.push({
        groupId: debt.groupId,
        groupName: debt.groupName,
        amount: debt.amount,
      })
    })

    return Object.values(consolidated).filter((debt) => debt.totalAmount > 0.01)
  }

  const confirmConsolidatedTransfer = async (consolidatedDebt: ConsolidatedDebt) => {
    if (!user) return

    try {
      // Crear transferencias en cada grupo afectado
      const transferPromises = consolidatedDebt.groups.map((group) =>
        addDoc(collection(db, "groups", group.groupId, "transfers"), {
          from: user.uid,
          to: consolidatedDebt.otherUserId,
          amount: group.amount,
          confirmedAt: new Date(),
          confirmedBy: user.uid,
        }),
      )

      await Promise.all(transferPromises)

      toast({
        title: "¡Transferencia consolidada confirmada! 💸",
        description: `Se registró el pago de $${formatAmount(consolidatedDebt.totalAmount)} a ${consolidatedDebt.otherUserName} en ${consolidatedDebt.groups.length} grupo${consolidatedDebt.groups.length > 1 ? "s" : ""}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transferencia consolidada",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "¡Copiado!",
        description: "Información copiada al portapapeles",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  const shareDebt = async (debt: ConsolidatedDebt) => {
    if (!user || !userProfile) return

    const paymentInfo = userProfile.paymentInfo ? `\n\nPodés transferirme a: ${userProfile.paymentInfo}` : ""
    const groupsList = debt.groups.map((g) => `• ${g.groupName}: $${formatAmount(g.amount)}`).join("\n")

    const message = `¡Hola ${debt.otherUserName}! 👋

Te escribo desde Vaquitapp para recordarte que tenés una deuda pendiente conmigo:

💰 Total: $${formatAmount(debt.totalAmount)}

📋 Desglose:
${groupsList}${paymentInfo}

¡Gracias! 😊`

    // Intentar usar Web Share API nativa
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Recordatorio de deuda - Vaquitapp",
          text: message,
        })
        return
      } catch (error) {
        // Si el usuario cancela, no hacer nada más
        if (error.name === "AbortError") return
        console.log("Share failed:", error)
      }
    }

    // Fallback: copiar al portapapeles si no hay Web Share API
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: "¡Mensaje copiado! 📋",
        description: "El recordatorio se copió al portapapeles",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo compartir el recordatorio",
        variant: "destructive",
      })
    }
  }

  const totalDebtsToMe = consolidatedDebtsToMe.reduce((sum, debt) => sum + debt.totalAmount, 0)
  const totalMyDebts = consolidatedMyDebts.reduce((sum, debt) => sum + debt.totalAmount, 0)

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="border-primary/20 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Consolidado de Deudas 💰</h1>
          <p className="text-muted-foreground">Resumen de todas tus deudas y créditos</p>
        </div>
      </div>

      {/* Resumen total */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-accent-foreground mx-auto mb-3" />
            <div className="text-sm text-accent-foreground mb-1">Te deben en total</div>
            <div className="text-2xl font-bold text-accent-foreground">${formatAmount(totalDebtsToMe)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {consolidatedDebtsToMe.length} persona{consolidatedDebtsToMe.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-8 w-8 text-destructive mx-auto mb-3" />
            <div className="text-sm text-destructive mb-1">Debés en total</div>
            <div className="text-2xl font-bold text-destructive">${formatAmount(totalMyDebts)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {consolidatedMyDebts.length} persona{consolidatedMyDebts.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para separar deudas */}
      <Tabs defaultValue="my-debts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-debts" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Mis Deudas ({consolidatedMyDebts.length})
          </TabsTrigger>
          <TabsTrigger value="debts-to-me" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Me Deben ({consolidatedDebtsToMe.length})
          </TabsTrigger>
        </TabsList>

        {/* Mis Deudas */}
        <TabsContent value="my-debts" className="space-y-4">
          {consolidatedMyDebts.length === 0 ? (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-primary mb-2">¡No tenés deudas!</h3>
                <p className="text-muted-foreground text-center">Estás al día con todos tus amigos</p>
              </CardContent>
            </Card>
          ) : (
            consolidatedMyDebts.map((debt) => (
              <Card key={debt.otherUserId} className="border-0 shadow-xl bg-gradient-to-br from-card to-destructive/5">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Le debés a {debt.otherUserName}
                    </div>
                    <div className="text-2xl font-bold">${formatAmount(debt.totalAmount)}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Desglose por grupo */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Desglose por grupo:</div>
                    {debt.groups.map((group) => (
                      <div key={group.groupId} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm">{group.groupName}</span>
                        <Badge variant="outline" className="text-destructive border-destructive/30">
                          ${formatAmount(group.amount)}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Información de pago */}
                  {debt.otherUserPaymentInfo ? (
                    <div className="p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl border border-accent/20">
                      <div className="space-y-2">
                        <div className="font-medium text-accent-foreground text-sm">Información de pago:</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-mono bg-white/50 px-2 py-1 rounded flex-1 break-all">
                            {debt.otherUserPaymentInfo}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(debt.otherUserPaymentInfo!)}
                            className="bg-transparent"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-destructive/10 rounded-xl text-center">
                      <div className="text-destructive font-medium text-sm">⚠️ Sin información de pago</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {debt.otherUserName} debe completar su perfil
                      </div>
                    </div>
                  )}

                  {/* Botón de confirmación */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Transferencia Consolidada
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                          💸 Confirmar transferencia a {debt.otherUserName}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-destructive/10 rounded-xl">
                          <div className="text-3xl font-bold text-destructive">${formatAmount(debt.totalAmount)}</div>
                          <div className="text-sm text-muted-foreground mt-1">Monto total a transferir</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Se confirmará en estos grupos:</div>
                          {debt.groups.map((group) => (
                            <div key={group.groupId} className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                              <span>{group.groupName}</span>
                              <span className="font-medium">${formatAmount(group.amount)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                          💡 Tip: Usa la descripción "Vaquitapp - Pago consolidado" en tu transferencia
                        </div>

                        <Button
                          onClick={() => confirmConsolidatedTransfer(debt)}
                          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Sí, confirmar transferencia
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Me Deben */}
        <TabsContent value="debts-to-me" className="space-y-4">
          {consolidatedDebtsToMe.length === 0 ? (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-xl font-bold text-primary mb-2">Nadie te debe dinero</h3>
                <p className="text-muted-foreground text-center">Todos están al día contigo</p>
              </CardContent>
            </Card>
          ) : (
            consolidatedDebtsToMe.map((debt) => (
              <Card key={debt.otherUserId} className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg text-accent-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {debt.otherUserName} te debe
                    </div>
                    <div className="text-2xl font-bold">${formatAmount(debt.totalAmount)}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Desglose por grupo */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Desglose por grupo:</div>
                    {debt.groups.map((group) => (
                      <div key={group.groupId} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm">{group.groupName}</span>
                        <Badge variant="outline" className="text-accent-foreground border-accent/30">
                          ${formatAmount(group.amount)}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Botón para compartir recordatorio */}
                  <Button
                    onClick={() => shareDebt(debt)}
                    variant="outline"
                    className="w-full border-accent/30 hover:bg-accent/10 text-accent-foreground bg-transparent"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Enviar Recordatorio
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
