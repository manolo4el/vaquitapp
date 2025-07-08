"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"

export interface Friend {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  sharedGroupsCount: number
  sharedGroups: Array<{
    id: string
    name: string
  }>
}

export function useFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setFriends([])
      setLoading(false)
      return
    }

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Obtener todos los usuarios únicos que comparten grupos conmigo
        const friendsMap = new Map<
          string,
          {
            uid: string
            sharedGroups: Array<{ id: string; name: string }>
          }
        >()

        groups.forEach((group) => {
          group.members.forEach((memberId: string) => {
            if (memberId !== user.uid) {
              if (!friendsMap.has(memberId)) {
                friendsMap.set(memberId, {
                  uid: memberId,
                  sharedGroups: [],
                })
              }
              friendsMap.get(memberId)!.sharedGroups.push({
                id: group.id,
                name: group.name,
              })
            }
          })
        })

        // Obtener datos de perfil de cada amigo
        const friendsData: Friend[] = []

        for (const [uid, friendInfo] of friendsMap.entries()) {
          try {
            const userDoc = await getDoc(doc(db, "users", uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              friendsData.push({
                uid,
                displayName: userData.displayName || userData.email || "Usuario",
                email: userData.email || "",
                photoURL: userData.photoURL,
                sharedGroupsCount: friendInfo.sharedGroups.length,
                sharedGroups: friendInfo.sharedGroups,
              })
            }
          } catch (error) {
            console.error(`Error loading user data for ${uid}:`, error)
          }
        }

        // Ordenar por cantidad de grupos compartidos (descendente)
        friendsData.sort((a, b) => b.sharedGroupsCount - a.sharedGroupsCount)

        setFriends(friendsData)
      } catch (error) {
        console.error("Error loading friends:", error)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [user])

  const searchFriends = (searchTerm: string): Friend[] => {
    if (!searchTerm.trim()) return friends

    const term = searchTerm.toLowerCase()
    return friends.filter(
      (friend) => friend.displayName.toLowerCase().includes(term) || friend.email.toLowerCase().includes(term),
    )
  }

  return {
    friends,
    loading,
    searchFriends,
  }
}
