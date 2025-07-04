"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Send, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"
import { getUserDisplayName } from "@/lib/calculations"
import Image from "next/image"

interface Message {
  id: string
  text: string
  userId: string
  createdAt: Timestamp | Date
  groupId: string
}

interface GroupChatProps {
  groupId: string
  groupName: string
  usersData: { [key: string]: any }
}

export function GroupChat({ groupId, groupName, usersData }: GroupChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [permissionError, setPermissionError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!groupId || !user) return

    const messagesRef = collection(db, "groups", groupId, "messages")
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[]

        setMessages(messagesData.reverse())
        setLoading(false)
        setPermissionError(false)

        // Solo hacer scroll si se debe hacer automáticamente
        if (shouldAutoScroll) {
          setTimeout(scrollToBottom, 100)
          setShouldAutoScroll(false)
        }
      },
      (error) => {
        console.error("Error fetching messages:", error)
        setLoading(false)
        if (error.code === "permission-denied") {
          setPermissionError(true)
          toast({
            title: "Error de permisos",
            description: "No tienes permisos para ver los mensajes de este grupo. Verifica las reglas de Firestore.",
            variant: "destructive",
          })
        }
      },
    )

    return () => unsubscribe()
  }, [groupId, user, shouldAutoScroll])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      const messagesRef = collection(db, "groups", groupId, "messages")
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: user.uid,
        groupId: groupId,
        createdAt: serverTimestamp(),
      })

      setNewMessage("")
      setPermissionError(false)
      setShouldAutoScroll(true) // Activar scroll automático después de enviar
    } catch (error: any) {
      console.error("Error sending message:", error)
      if (error.code === "permission-denied") {
        setPermissionError(true)
        toast({
          title: "Error de permisos",
          description: "No tienes permisos para enviar mensajes. Verifica las reglas de Firestore.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (timestamp: Timestamp | Date) => {
    let date: Date

    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ""
    }

    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl text-primary flex items-center gap-2">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          Chat del Rebaño
          {permissionError && <AlertCircle className="h-4 w-4 text-destructive" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Actualiza las reglas de Firestore para habilitar el chat.</span>
            </div>
          </div>
        )}

        {/* Área de mensajes */}
        <div className="h-64 sm:h-80 overflow-y-auto bg-muted/20 rounded-xl p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <div className="text-sm text-muted-foreground">Cargando mensajes...</div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <div className="text-3xl">💬</div>
                <div className="text-sm text-muted-foreground">¡Inicia la conversación!</div>
                <div className="text-xs text-muted-foreground">
                  Comparte ideas, coordina gastos o simplemente charla con el rebaño
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.userId === user?.uid
                const userName = getUserDisplayName(message.userId, usersData)
                const userPhoto = usersData[message.userId]?.photoURL

                return (
                  <div key={message.id} className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage && (
                      <div className="flex-shrink-0">
                        {userPhoto ? (
                          <Image
                            src={userPhoto || "/placeholder.svg"}
                            alt={userName}
                            width={32}
                            height={32}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isOwnMessage ? "order-first" : ""}`}>
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          isOwnMessage ? "bg-primary text-primary-foreground ml-auto" : "bg-white border border-border"
                        }`}
                      >
                        {!isOwnMessage && <div className="text-xs font-medium text-primary mb-1">{userName}</div>}
                        <div className="text-sm break-words">{message.text}</div>
                      </div>
                      <div
                        className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div className="flex-shrink-0">
                        {userPhoto ? (
                          <Image
                            src={userPhoto || "/placeholder.svg"}
                            alt={userName}
                            width={32}
                            height={32}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input para nuevo mensaje */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Escribe un mensaje..."
            disabled={sending || permissionError}
            className="flex-1 border-primary/20 focus:border-primary"
            maxLength={500}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || permissionError}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-3"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Contador de caracteres */}
        {newMessage.length > 400 && (
          <div className="text-xs text-muted-foreground text-right">{newMessage.length}/500 caracteres</div>
        )}
      </CardContent>
    </Card>
  )
}
