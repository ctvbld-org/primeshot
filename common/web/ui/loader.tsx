import { cn } from "../../lib/utils"

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

// Tailwind-free SVG spinner (works in all packages without utility CSS)
export function Loader({ size = 'md', text, className }: LoaderProps) {
  const px = size === 'sm' ? 18 : size === 'lg' ? 36 : 24
  const stroke = Math.max(2, Math.round(px / 12))

  return (
    <div className={cn(className)} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} style={{ display: 'block' }}>
        <circle
          cx={px / 2}
          cy={px / 2}
          r={(px - stroke) / 2}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={(px - stroke) / 2}
          stroke="#2ADED8"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * (px - stroke)} ${Math.PI * (px - stroke)}`}
          strokeDashoffset={Math.PI * (px - stroke) * 0.75}
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${px / 2} ${px / 2}`}
            to={`360 ${px / 2} ${px / 2}`}
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {text && (
        <span style={{ fontSize: 12, color: '#b6e3e2' }}>{text}</span>
      )}
    </div>
  )
}