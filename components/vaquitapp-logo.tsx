import Image from "next/image"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className = "" }: VaquitappLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/vaquitapp-icon.svg"
        alt="VaquitApp Logo"
        width={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 32 : 24}
        height={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 32 : 24}
        className={sizeClasses[size]}
      />
      {showText && <span className={`font-bold text-green-600 ${textSizeClasses[size]}`}>VaquitApp</span>}
    </div>
  )
}
