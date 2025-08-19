import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import styles from './button.module.css'
import { cn } from "../../lib/utils"

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconSide?: string
}

interface AnimationState {
  targetLabelX: number
  targetLabelY: number
  targetBtnX: number
  targetBtnY: number
  currentLabelX: number
  currentLabelY: number
  currentBtnX: number
  currentBtnY: number
  gradientPosition: number
}

const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className,
  loading,
  iconSide = 'left',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string    
  iconSide?: string
  loading?: boolean
} = {}) => {
  return cn(
    styles.base,
    variant && styles[variant],
    size && styles[`size-${size}`],
    loading && styles.loading,
    iconSide && styles[`icon-${iconSide}`],
    className
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, loading = false, children, disabled, icon, iconSide = 'left', ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const labelRef = React.useRef<HTMLSpanElement>(null);
    const iconRef = React.useRef<HTMLSpanElement>(null);
    const animationFrameRef = React.useRef<number | null>(null);
    const gradientAnimationRef = React.useRef<number | null>(null);
    const isHoveringRef = React.useRef(false);
    const animationStateRef = React.useRef<AnimationState>({
      targetLabelX: 0,
      targetLabelY: 0,
      targetBtnX: 2,
      targetBtnY: 2,
      currentLabelX: 0,
      currentLabelY: 0,
      currentBtnX: 0,
      currentBtnY: 0,
      gradientPosition: 0
    });

    // React.useEffect(() => {
    //   const btn = buttonRef.current;
    //   const label = labelRef.current;
    //   const icon = iconRef.current;

    //   if (!btn || !label) return;

    //   const animate = () => {
    //     const state = animationStateRef.current;
        
    //     // Smooth interpolation between current and target positions
    //     state.currentLabelX += (state.targetLabelX - state.currentLabelX) * 0.15;
    //     state.currentLabelY += (state.targetLabelY - state.currentLabelY) * 0.15;
    //     state.currentBtnX += (state.targetBtnX - state.currentBtnX) * 0.9;
    //     state.currentBtnY += (state.targetBtnY - state.currentBtnY) * 0.9;

    //     // Apply transforms
    //     label.style.transform = `translate3d(${state.currentLabelX}px, ${state.currentLabelY}px, 0)`;
    //     btn.style.transform = `translate3d(${state.currentBtnX}px, ${state.currentBtnY}px, 0)`;

    //     if (icon) {
    //       icon.style.transform = `translate3d(${state.currentLabelX}px, ${state.currentLabelY}px, 0)`;
    //     }

    //     // Continue animation if there's still significant movement
    //     if (
    //       Math.abs(state.targetLabelX - state.currentLabelX) > 0.01 ||
    //       Math.abs(state.targetLabelY - state.currentLabelY) > 0.01 ||
    //       Math.abs(state.targetBtnX - state.currentBtnX) > 0.01 ||
    //       Math.abs(state.targetBtnY - state.currentBtnY) > 0.01
    //     ) {
    //       animationFrameRef.current = requestAnimationFrame(animate);
    //     } else {
    //       if (animationFrameRef.current) {
    //         cancelAnimationFrame(animationFrameRef.current);
    //         animationFrameRef.current = null;
    //       }
    //     }
    //   };

    //   const animateGradient = () => {
    //     const state = animationStateRef.current;
        
    //     if (isHoveringRef.current) {
    //       // Continuous animation while hovering
    //       state.gradientPosition = (state.gradientPosition + 1) % 200;
    //     } else {
    //       // Smooth return to 0
    //       state.gradientPosition += (0 - state.gradientPosition) * 0.1;
          
    //       if (Math.abs(state.gradientPosition) < 0.1) {
    //         state.gradientPosition = 0;
    //         if (gradientAnimationRef.current) {
    //           cancelAnimationFrame(gradientAnimationRef.current);
    //           gradientAnimationRef.current = null;
    //         }
    //         return;
    //       }
    //     }

    //     // Apply the gradient position
    //     if (btn) {
    //       const x = state.gradientPosition <= 100 
    //         ? 100 - state.gradientPosition 
    //         : state.gradientPosition - 100;
    //       const y = state.gradientPosition <= 100 ? 0 : 100;
    //       btn.style.backgroundPosition = `${x}% ${y}%`;
    //     }

    //     gradientAnimationRef.current = requestAnimationFrame(animateGradient);
    //   };

    //   const handleMouseMove = (e: MouseEvent) => {
    //     const rect = btn.getBoundingClientRect();

    //     // Calculate mouse position relative to button center
    //     const centerX = rect.width / 2;
    //     const centerY = rect.height / 2;
    //     const mouseX = e.clientX - rect.left;
    //     const mouseY = e.clientY - rect.top;

    //     // Calculate distance from center (0 to 1)
    //     const moveX = (mouseX - centerX) / (rect.width / 2);
    //     const moveY = (mouseY - centerY) / (rect.height / 2);

    //     // Set target positions
    //     animationStateRef.current.targetLabelX = moveX * (rect.width / 25);
    //     animationStateRef.current.targetLabelY = moveY * (rect.height / 25);
    //     animationStateRef.current.targetBtnX = moveX * (rect.width / 50);
    //     animationStateRef.current.targetBtnY = moveY * (rect.height / 50);

    //     // Start animation if not already running
    //     if (!animationFrameRef.current) {
    //       animationFrameRef.current = requestAnimationFrame(animate);
    //     }
    //   };

    //   const handleMouseEnter = () => {
    //     isHoveringRef.current = true;
    //     if (!gradientAnimationRef.current) {
    //       gradientAnimationRef.current = requestAnimationFrame(animateGradient);
    //     }
    //   };

    //   const handleMouseLeave = () => {
    //     isHoveringRef.current = false;
    //     // Set targets to 0 for smooth return to center
    //     animationStateRef.current.targetLabelX = 0;
    //     animationStateRef.current.targetLabelY = 0;
    //     animationStateRef.current.targetBtnX = 0;
    //     animationStateRef.current.targetBtnY = 0;

    //     // Ensure animation is running for the return movement
    //     if (!animationFrameRef.current) {
    //       animationFrameRef.current = requestAnimationFrame(animate);
    //     }
    //   };

    //   btn.addEventListener('mousemove', handleMouseMove);
    //   btn.addEventListener('mouseenter', handleMouseEnter);
    //   btn.addEventListener('mouseleave', handleMouseLeave);

    //   return () => {
    //     btn.removeEventListener('mousemove', handleMouseMove);
    //     btn.removeEventListener('mouseenter', handleMouseEnter);
    //     btn.removeEventListener('mouseleave', handleMouseLeave);
    //     if (animationFrameRef.current) {
    //       cancelAnimationFrame(animationFrameRef.current);
    //     }
    //     if (gradientAnimationRef.current) {
    //       cancelAnimationFrame(gradientAnimationRef.current);
    //     }
    //   };
    // }, []);

    // Combine the forwarded ref with our animation ref
    const combinedRef = (node: HTMLButtonElement) => {
      buttonRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement>).current = node;
      }
    };

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className, loading, iconSide }), styles.btn)}
        ref={combinedRef}
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
        {icon && (
          <span ref={iconRef} className={styles.btnIcon}>
            {icon}
          </span>
        )}
        {children && (
          <span ref={labelRef} className={styles.btnLabel}>
            {children}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
