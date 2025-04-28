import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import styles from './button.module.css'
import { cn } from "@/lib/utils"

type ButtonVariant = 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  loading?: boolean
}

const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className,
  loading,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  loading?: boolean
} = {}) => {
  return cn(
    styles.base,
    variant && styles[variant],
    size && styles[`size-${size}`],
    loading && styles.loading,
    className
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={buttonVariants({ variant, size, className, loading })}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className={styles.spinner}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            role="img"  
            aria-label="Loading"  
            aria-hidden="true" 
          >
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
