"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export function useFirebasePermissions() {
  const { user } = useAuth()
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setHasPermissions(null)
        return
      }

      setIsChecking(true)
      try {
        // Intentar leer el documento del usuario para verificar permisos
        const userRef = doc(db, "users", user.uid)
        await getDoc(userRef)
        setHasPermissions(true)
        console.log("Firebase permissions: OK")
      } catch (error: any) {
        console.error("Firebase permissions error:", error)
        if (error.code === "permission-denied") {
          setHasPermissions(false)
        } else {
          // Otros errores no son de permisos
          setHasPermissions(true)
        }
      } finally {
        setIsChecking(false)
      }
    }

    checkPermissions()
  }, [user])

  return { hasPermissions, isChecking }
}
