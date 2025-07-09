"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useFriends } from "@/hooks/use-friends"
import { Users, Search, UserPlus, X } from "lucide-react"
import Image from "next/image"

interface FriendsSelectorProps {
  selectedFriends: string[]
  onFriendsChange: (friendIds: string[]) => void
  trigger?: React.ReactNode
  title?: string
  description?: string
  maxSelection?: number
}

export function FriendsSelector({
  selectedFriends,
  onFriendsChange,
  trigger,
  title = "Seleccionar Amigos",
  description = "Elige amigos con los que ya compartiste grupos",
  maxSelection,
}: FriendsSelectorProps) {
  const { friends, loading, searchFriends } = useFriends()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFriends = searchFriends(searchTerm)
  const selectedFriendsData = friends.filter((friend) => selectedFriends.includes(friend.uid))

  const handleFriendToggle = (friendId: string) => {
    const isSelected = selectedFriends.includes(friendId)

    if (isSelected) {
      onFriendsChange(selectedFriends.filter((id) => id !== friendId))
    } else {
      if (maxSelection && selectedFriends.length >= maxSelection) {
        return // No permitir más selecciones
      }
      onFriendsChange([...selectedFriends, friendId])
    }
  }

  const removeFriend = (friendId: string) => {
    onFriendsChange(selectedFriends.filter((id) => id !== friendId))
  }

  const defaultTrigger = (
    <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
      <UserPlus className="h-4 w-4 mr-2" />
      Agregar Amigos
      {selectedFriends.length > 0 && (
        <Badge variant="secondary" className="ml-2">
          {selectedFriends.length}
        </Badge>
      )}
    </Button>
  )

  return (
    <>
      {/* Mostrar amigos seleccionados */}
      {selectedFriends.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-primary">Amigos seleccionados:</div>
          <div className="flex flex-wrap gap-2">
            {selectedFriendsData.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
              >
                {friend.photoURL && (
                  <Image
                    src={friend.photoURL || "/placeholder.svg"}
                    alt={friend.displayName}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span>{friend.displayName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFriend(friend.uid)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar amigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>

            {/* Lista de amigos */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Cargando amigos...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No se encontraron amigos" : "Aún no tienes amigos"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!searchTerm && "Los amigos aparecen cuando compartes grupos con otros usuarios"}
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.uid)
                  const isDisabled = maxSelection && !isSelected && selectedFriends.length >= maxSelection

                  return (
                    <div
                      key={friend.uid}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary/30"
                          : isDisabled
                            ? "bg-muted/30 border-muted opacity-50"
                            : "bg-card border-border hover:bg-muted/50 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && handleFriendToggle(friend.uid)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && handleFriendToggle(friend.uid)}
                      />

                      <div className="flex items-center space-x-3 flex-1">
                        {friend.photoURL ? (
                          <Image
                            src={friend.photoURL || "/placeholder.svg"}
                            alt={friend.displayName}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{friend.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{friend.email}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {friend.sharedGroupsCount} grupo{friend.sharedGroupsCount !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Información de selección */}
            {maxSelection && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
                {selectedFriends.length} de {maxSelection} amigos seleccionados
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              Confirmar ({selectedFriends.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
