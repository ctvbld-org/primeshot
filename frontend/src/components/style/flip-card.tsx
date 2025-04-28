import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { forwardRef, useState } from "react"

interface FlipCardProps {
  className?: string
  isFlipped: boolean
  frontContent: React.ReactNode
  backContent: React.ReactNode
  onClick?: () => void
  id?: string
}

export const FlipCard = forwardRef<HTMLDivElement, FlipCardProps>(({
  className,
  isFlipped,
  frontContent,
  backContent,
  onClick,
  id
}, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Start animation when flip state changes
  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  // Remove preserve-3d after animation completes
  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "relative w-full",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      id={id}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Add preserve-3d only during animation */}
      <div className={cn(
        "relative w-full h-full",
        isAnimating && "preserve-3d"
      )}>
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden"
          initial={false}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            zIndex: isFlipped ? 0 : 1
          }}
          transition={{
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1]
          }}
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d'
          }}
          onAnimationStart={handleAnimationStart}
          onAnimationComplete={handleAnimationComplete}
        >
          {frontContent}
        </motion.div>

        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden"
          initial={false}
          animate={{
            rotateY: isFlipped ? 360 : 180,
            zIndex: isFlipped ? 1 : 0
          }}
          transition={{
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1]
          }}
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d'
          }}
        >
          {backContent}
        </motion.div>
      </div>
    </div>
  )
})