import Image from "next/image"

interface VaquitappLogoProps {
  size?: number
  className?: string
}

export function VaquitappLogo({ size = 40, className = "" }: VaquitappLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/vaquitapp-icon.svg" alt="VaquitApp" width={size} height={size} className="rounded-lg" />
      <span className="text-xl font-bold text-green-600">VaquitApp</span>
    </div>
  )
}
