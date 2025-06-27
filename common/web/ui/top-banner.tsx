'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import styles from "./top-banner.module.css"

const bannerVariants = cva(styles.banner, {
  variants: {
    variant: {
      default: styles.default,
      success: styles.success,
      destructive: styles.destructive,
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface TopBannerProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof bannerVariants> {
  title?: string
  description?: string
  onClose?: () => void
  showClose?: boolean
}

const TopBanner = React.forwardRef<HTMLDivElement, TopBannerProps>(
  ({ className, variant, title, description, onClose, showClose = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(bannerVariants({ variant }), className)}
        {...props}
      >
        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          {description && <div className={styles.description}>{description}</div>}
        </div>
        {showClose && (
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
TopBanner.displayName = "TopBanner"

export { TopBanner } 