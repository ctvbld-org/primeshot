export const fadeAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { 
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number]
  }
} 