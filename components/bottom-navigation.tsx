"use client"

import { Button } from "@/components/ui/button"
import { Home, User } from "lucide-react"

interface BottomNavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/10 p-4 z-40">
      <div className="max-w-md mx-auto flex justify-around">
        <Button
          variant={currentPage === "dashboard" ? "default" : "ghost"}
          size="sm"
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
            currentPage === "dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Inicio</span>
        </Button>

        <Button
          variant={currentPage === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => onNavigate("profile")}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
            currentPage === "profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Perfil</span>
        </Button>
      </div>
    </div>
  )
}
