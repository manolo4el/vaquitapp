import Image from "next/image"
import { cn } from "@/lib/utils"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number
  className?: string
}

export function VaquitappLogo({ size = "md", className }: VaquitappLogoProps) {
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
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/vaquitapp-icon.svg" alt="VaquitApp" width={logoSize} height={logoSize} className="flex-shrink-0" />
      <span className="font-bold text-green-700" style={{ fontSize: `${logoSize * 0.4}px` }}>
        VaquitApp
      </span>
    </div>
  )
}
