import Image from "next/image"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className = "" }: VaquitappLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/vaquitapp-icon.svg"
        alt="VaquitApp"
        width={size === "sm" ? 32 : size === "md" ? 48 : 64}
        height={size === "sm" ? 32 : size === "md" ? 48 : 64}
        className={sizeClasses[size]}
      />
      {showText && <span className={`font-bold text-green-700 ${textSizeClasses[size]}`}>VaquitApp</span>}
    </div>
  )
}
