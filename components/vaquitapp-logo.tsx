import Image from "next/image"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className = "" }: VaquitappLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image
        src="/vaquitapp-icon.svg"
        alt="VaquitApp"
        width={size === "sm" ? 24 : size === "md" ? 32 : 48}
        height={size === "sm" ? 24 : size === "md" ? 32 : 48}
        className={sizeClasses[size]}
      />
      {showText && <span className={`font-bold text-green-600 ${textSizeClasses[size]}`}>VaquitApp</span>}
    </div>
  )
}
