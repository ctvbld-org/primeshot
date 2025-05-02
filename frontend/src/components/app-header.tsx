import Image from 'next/image'
import { UserNav } from '@/components/user-nav'
import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import styles from './app-header.module.css'
import React from 'react'
import { Icon } from '@/components/icons/icon'
interface AppHeaderProps {
  user: User | null
}

const steps = [
  { id: 'shoot', label: 'Add Styles', paths: ['/app/shoot', '/app/styles'] },
  { id: 'payment', label: 'Checkout', paths: ['/app/payment'] },
  { id: 'upload', label: 'Upload Photos', paths: ['/app/upload'] },
  { id: 'generate', label: 'Generate', paths: ['/app/generate'] }
]

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname()
  
  // Find current step index
  const currentStepIndex = steps.findIndex(step => 
    step.paths.some(path => pathname.startsWith(path))
  )
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Image 
          src="/logo.svg" 
          alt="Primeshot Logo" 
          width={40} 
          height={40}
          priority
        />
        
        <div className={styles.progressSteps}>
          {steps.map((step, index) => {
            const isCompleted = currentStepIndex > index
            const isActive = currentStepIndex === index
            
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={cn(
                    styles.step,
                    isActive && styles.active,
                    isCompleted && styles.completed
                  )}
                >   
                    {isCompleted ? <Icon variant='check' size={20} /> : <div className={styles.stepIcon}>{index + 1}</div>}
                    <span>{step.label}</span>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        <div className={styles.rightSection}>
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
} 