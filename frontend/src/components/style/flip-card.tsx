import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { forwardRef } from "react"

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
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full w-[384px] h-[626px] preserve-3d rounded-[36px]",
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
      <motion.div
        className="absolute inset-0 backface-hidden w-full h-full"
        animate={{
          rotateY: isFlipped ? 180 : 0
        }}
        transition={{
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        {frontContent}
      </motion.div>

      <motion.div
        className="absolute inset-0 backface-hidden w-full h-full card-back"
        animate={{
          rotateY: isFlipped ? 360 : 180
        }}
        transition={{
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        {backContent}
      </motion.div>
    </div>
  )
}) 