import { cn } from "@/lib/utils"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number
  className?: string
  showText?: boolean
}

export function VaquitappLogo({ size = "md", className, showText = false }: VaquitappLogoProps) {
  const getSize = () => {
    if (typeof size === "number") return size

    switch (size) {
      case "sm":
        return 32
      case "md":
        return 48
      case "lg":
        return 64
      case "xl":
        return 80
      default:
        return 48
    }
  }

  const logoSize = getSize()

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <img
          src="/vaquitapp-icon.svg"
          alt="VaquitApp Logo"
          width={logoSize}
          height={logoSize}
          className="drop-shadow-sm"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-green-700">VaquitApp</h1>
          <p className="text-sm text-green-600">Divide gastos fácil</p>
        </div>
      )}
    </div>
  )
}
