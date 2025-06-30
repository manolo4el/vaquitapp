import { cn } from "@/lib/utils"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className }: VaquitappLogoProps) {
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
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Logo Icon */}
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-lime-400 to-violet-500 flex items-center justify-center",
          sizeClasses[size],
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-1/2 h-1/2 text-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" />
          <path
            d="M12 16L13.09 22.26L20 23L13.09 23.74L12 30L10.91 23.74L4 23L10.91 22.26L12 16Z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={cn(
            "font-bold bg-gradient-to-r from-lime-600 to-violet-600 bg-clip-text text-transparent",
            textSizeClasses[size],
          )}
        >
          Vaquitapp
        </span>
      )}
    </div>
  )
}
