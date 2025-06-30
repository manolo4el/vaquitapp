interface VaquitappLogoProps {
  className?: string
  size?: number
}

export function VaquitappLogo({ className = "", size = 40 }: VaquitappLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <rect width="40" height="40" rx="8" fill="currentColor" />
        <path d="M12 16h16v2H12v-2zm0 4h16v2H12v-2zm0 4h12v2H12v-2z" fill="white" />
        <circle cx="8" cy="17" r="2" fill="white" />
        <circle cx="8" cy="21" r="2" fill="white" />
        <circle cx="8" cy="25" r="2" fill="white" />
      </svg>
      <span className="text-xl font-bold text-primary">VaquitApp</span>
    </div>
  )
}
