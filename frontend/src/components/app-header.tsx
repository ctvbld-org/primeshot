import Image from 'next/image'
import { UserNav } from '@/components/user-nav'
import { User } from '@supabase/supabase-js'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import styles from './app-header.module.css'
import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/icons/icon'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { useStyles } from '@/hooks/useStyles'

interface AppHeaderProps {
  user: User | null
}

const steps = [
  { id: 'shoot', label: 'navigation.addStyles' as const, paths: ['/app/shoot', '/app/styles'] },
  { id: 'payment', label: 'navigation.checkout' as const, paths: ['/app/payment'] },
  { id: 'upload', label: 'navigation.uploadPhotos' as const, paths: ['/app/upload'] },
  { id: 'generate', label: 'navigation.generate' as const, paths: ['/app/generate'] }
]

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Use the new useStyles hook to get draft styles count
  const { styles: draftStyles = [], isLoading } = useStyles({ status: 'draft' })
  const stylesCount = draftStyles.length

  // Find current step index
  const currentStepIndex = steps.findIndex(step => 
    step.paths.some(path => pathname.startsWith(path))
  )

  // Get current step for mobile display
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null

  // Check if we should show the basket
  const showBasket = pathname.startsWith('/app/shoot') || 
                    pathname.startsWith('/app/styles') || 
                    pathname.startsWith('/app/payment')

  // Handle click outside to close popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current && 
        buttonRef.current && 
        !popupRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate popup position based on current step
  const getPopupStyle = () => {
    if (!buttonRef.current || !popupRef.current) return {}
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const popupRect = popupRef.current.getBoundingClientRect()
    const stepHeight = 48 // Height of each step item
    const currentStepOffset = currentStepIndex * stepHeight
    
    return {
      top: `${buttonRect.top - currentStepOffset}px`,
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }

  // Handle basket click
  const handleBasketClick = () => {
    router.push('/app/shoot')
  }
  
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
                    {isCompleted ? <Icon variant='check' size={23} /> : <div className={styles.stepIcon}>{index + 1}</div>}
                    <span>{t(step.label)}</span>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        {/* Mobile Progress Button & Popup */}
        <button 
          ref={buttonRef}
          className={styles.mobileProgressButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.stepIcon}>{currentStepIndex + 1}</div>
          <span>{currentStep ? t(currentStep.label) : t('navigation.addStyles')}</span>
          <MoreVertical size={12} />
        </button>

        <div 
          ref={popupRef}
          className={cn(styles.mobileStepsList, isOpen && styles.visible)}
          style={getPopupStyle()}
          onClick={() => setIsOpen(false)}
        >
          {steps.map((step, index) => {
            const isCompleted = currentStepIndex > index
            const isActive = currentStepIndex === index
            
            return (
              <div 
                key={step.id}
                className={cn(
                  styles.mobileStep,
                  isActive && styles.active,
                  isCompleted && styles.completed
                )}
              >   
                {isCompleted ? <Icon variant='check' size={20} /> : <div className={styles.stepIcon}>{index + 1}</div>}
                <span>{t(step.label)}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.rightSection}>
          {showBasket && (
            <button 
              onClick={handleBasketClick}
              className={cn(
                styles.basketButton,
                stylesCount > 0 && styles.basketActive
              )}
            >
              <Icon 
                variant="basket" 
                size={20} 
                className={cn(
                  styles.basketIcon,
                  stylesCount > 0 && styles.basketIconActive
                )}
              />
              {stylesCount > 0 && (
                <span className={styles.basketCount}>{stylesCount}</span>
              )}
            </button>
          )}
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
} 