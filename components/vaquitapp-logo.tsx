"use client"

import Image from "next/image"

interface VaquitappLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className = "" }: VaquitappLogoProps) {
  const iconSizeClasses = {
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

  const gapClasses = {
    sm: "space-x-2",
    md: "space-x-3",
    lg: "space-x-4",
    xl: "space-x-4",
  }

  return (
    <div className={`flex items-center ${showText ? gapClasses[size] : ""} ${className}`}>
      {/* Ícono de la vaca */}
      <div className={`${iconSizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/vaquitapp-icon.svg"
          alt="Vaquitapp"
          width={64}
          height={64}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Texto del logo */}
      {showText && <h1 className={`${textSizeClasses[size]} font-bold text-green-600`}>Vaquitapp</h1>}
    </div>
  )
}
