interface VaquitappLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl"
  className?: string
}

export function VaquitappLogo({ size = "md", className = "" }: VaquitappLogoProps) {
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
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <svg width={logoSize} height={logoSize} viewBox="0 0 100 100" className="text-green-600" fill="currentColor">
          {/* Cuerpo de la vaca */}
          <ellipse cx="50" cy="60" rx="35" ry="25" fill="#4ade80" />

          {/* Cabeza */}
          <ellipse cx="50" cy="35" rx="20" ry="18" fill="#4ade80" />

          {/* Manchas */}
          <ellipse cx="40" cy="55" rx="8" ry="6" fill="#16a34a" />
          <ellipse cx="65" cy="65" rx="6" ry="8" fill="#16a34a" />
          <ellipse cx="45" cy="30" rx="4" ry="5" fill="#16a34a" />

          {/* Ojos */}
          <circle cx="45" cy="30" r="3" fill="white" />
          <circle cx="55" cy="30" r="3" fill="white" />
          <circle cx="45" cy="30" r="1.5" fill="black" />
          <circle cx="55" cy="30" r="1.5" fill="black" />

          {/* Nariz */}
          <ellipse cx="50" cy="40" rx="4" ry="3" fill="#16a34a" />
          <ellipse cx="48" cy="39" rx="1" ry="0.8" fill="black" />
          <ellipse cx="52" cy="39" rx="1" ry="0.8" fill="black" />

          {/* Cuernos */}
          <path d="M42 20 L40 15 L44 18 Z" fill="#fbbf24" />
          <path d="M58 20 L60 15 L56 18 Z" fill="#fbbf24" />

          {/* Patas */}
          <rect x="35" y="80" width="6" height="15" fill="#16a34a" rx="3" />
          <rect x="45" y="80" width="6" height="15" fill="#16a34a" rx="3" />
          <rect x="55" y="80" width="6" height="15" fill="#16a34a" rx="3" />
          <rect x="65" y="80" width="6" height="15" fill="#16a34a" rx="3" />

          {/* Cola */}
          <path d="M85 55 Q90 50 88 65 Q85 70 82 65" fill="#16a34a" />

          {/* Orejas */}
          <ellipse cx="38" cy="25" rx="4" ry="8" fill="#22c55e" transform="rotate(-30 38 25)" />
          <ellipse cx="62" cy="25" rx="4" ry="8" fill="#22c55e" transform="rotate(30 62 25)" />
        </svg>

        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-full opacity-50"></div>
      </div>

      {size !== "sm" && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-green-700">VaquitApp</span>
          <span className="text-sm text-green-600 -mt-1">Gastos compartidos</span>
        </div>
      )}
    </div>
  )
}
