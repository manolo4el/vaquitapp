import Image from "next/image"

interface VaquitappLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function VaquitappLogo({ size = "md", showText = true, className = "" }: VaquitappLogoProps) {
  // Convert size to pixels
  let sizeInPx: number
  switch (size) {
    case "sm":
      sizeInPx = 32
      break
    case "md":
      sizeInPx = 48
      break
    case "lg":
      sizeInPx = 64
      break
    case "xl":
      sizeInPx = 80
      break
    default:
      sizeInPx = typeof size === "number" ? size : 48
  }

  const textSize = sizeInPx > 64 ? "text-2xl" : sizeInPx > 48 ? "text-xl" : sizeInPx > 32 ? "text-lg" : "text-base"

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/vaquitapp-icon.svg"
        alt="VaquitApp Logo"
        width={sizeInPx}
        height={sizeInPx}
        className="flex-shrink-0"
      />
      {showText && <span className={`font-bold text-green-700 ${textSize}`}>VaquitApp</span>}
    </div>
  )
}
