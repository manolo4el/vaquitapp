import { cn } from "@/lib/utils"

interface VaquitappLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function VaquitappLogo({ size = "md", className, showText = false }: VaquitappLogoProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  }

  const iconSize = typeof size === "number" ? size : sizeMap[size]
  const textSize = typeof size === "number" ? size / 3 : sizeMap[size] / 3

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img src="/vaquitapp-icon.svg" alt="VaquitApp" width={iconSize} height={iconSize} className="flex-shrink-0" />
      {showText && (
        <span className="font-bold text-green-700" style={{ fontSize: `${textSize}px` }}>
          VaquitApp
        </span>
      )}
    </div>
  )
}
