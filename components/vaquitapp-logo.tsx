import { cn } from "@/lib/utils"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
}

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
}

export function VaquitappLogo({ size = "md", showText = false, className }: VaquitappLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo circular con gradiente */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          {/* Círculo de fondo */}
          <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />

          {/* Símbolo de dinero estilizado */}
          <g fill="white">
            {/* Símbolo $ */}
            <path
              d="M45 20 L45 25 M45 75 L45 80 M35 30 Q35 25 40 25 L55 25 Q60 25 60 30 Q60 35 55 35 L40 35 Q35 35 35 40 Q35 45 40 45 L55 45 Q60 45 60 50 Q60 55 55 55 L40 55 Q35 55 35 60 Q35 65 40 65 L55 65 Q60 65 60 70"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            {/* Puntos decorativos */}
            <circle cx="25" cy="35" r="3" />
            <circle cx="75" cy="35" r="3" />
            <circle cx="25" cy="65" r="3" />
            <circle cx="75" cy="65" r="3" />
          </g>
        </svg>
      </div>

      {showText && <span className={cn("font-bold text-gray-800", textSizeClasses[size])}>Vaquitapp</span>}
    </div>
  )
}
